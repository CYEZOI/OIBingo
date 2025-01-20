import { Queue } from "typescript-queue";
import { Database } from "./Database";
import { Output } from "./Output";
import { Result, ThrowErrorIfFailed } from "./Result";
import * as base64js from "base64-js";

export class Luogu {
    static Fetch = async (DB: Database, Username: string, URL: string, Options: RequestInit = {}): Promise<any> => {
        const cookies = (await DB.Select("Users", ["LuoguCookies",], { Username, })).Data["Results"][0]["LuoguCookies"];
        if (Options.headers == null) Options.headers = {};
        Options.headers["cookie"] = cookies;
        Options.redirect = "manual";

        const LuoguResponse = await fetch(URL, Options);
        const ResponseArrayBuffer = await LuoguResponse.arrayBuffer();
        const ResponseText = new TextDecoder().decode(ResponseArrayBuffer);

        var NewCookies: Array<string> = [];
        const SetCookie = LuoguResponse.headers.getSetCookie();
        if (SetCookie) {
            SetCookie.map((value: string) => {
                NewCookies.push(value.split(";")[0]);
            });
        }
        if (ResponseText.indexOf("C3VK") != -1) {
            NewCookies.push("C3VK=" + ResponseText.substring(ResponseText.indexOf("C3VK") + 5, ResponseText.indexOf("C3VK") + 5 + 6));
        }

        const OldCookies = (cookies ? cookies.split(";") : []);
        const MergedCookies: Map<string, string> = new Map<string, string>();
        OldCookies.map((value: string) => {
            MergedCookies.set(value.split("=")[0], value.split("=")[1]);
        });
        NewCookies.map((value: string) => {
            MergedCookies.set(value.split("=")[0], value.split("=")[1]);
        });
        let CookiesStringNew: string = "";
        MergedCookies.forEach((value, key) => {
            CookiesStringNew += key + "=" + value + ";";
        });
        CookiesStringNew = CookiesStringNew.substring(0, CookiesStringNew.length - 1);
        if (CookiesStringNew !== cookies) {
            Output.Warn(`Trigger protection, 
    old cookies: ${OldCookies}, 
    new cookies: ${NewCookies}, 
    merged cookies: ${CookiesStringNew}`);
        }
        ThrowErrorIfFailed(await DB.Update("Users", {
            "LuoguCookies": CookiesStringNew,
        }, { Username }));

        if ((ResponseText.indexOf("window.open") != -1 &&
            ResponseText.indexOf("_self") != -1 &&
            ResponseText.indexOf("C3VK") != -1) ||
            LuoguResponse.status == 302) {
            return await Luogu.Fetch(DB, Username, URL, Options);
        }

        return new Response(new ReadableStream({
            start(controller) {
                controller.enqueue(ResponseArrayBuffer);
                controller.close();
            }
        }), {
            status: LuoguResponse.status,
            statusText: LuoguResponse.statusText,
            headers: LuoguResponse.headers,
        });
    };

    static GenerateNewCookies = async (DB: Database, Username: string): Promise<Result> => {
        ThrowErrorIfFailed(await DB.Update("Users", {
            "LuoguCookies": "",
        }, { Username }));
        await this.Fetch(DB, Username, "https://www.luogu.com.cn/");
        return new Result(true, "Cookies set");
    }
    static CheckLogin = async (DB: Database, Username: string): Promise<Result> => {
        if ((await this.Fetch(DB, Username, "https://www.luogu.com.cn/chat?_contentOnly=1", {})
            .then(ResponseData => {
                const location = ResponseData.headers.get("location");
                return !location || location.indexOf("login") == -1;
            }))) {
            return new Result(true, "Luogu logged in");
        }
        return new Result(false, "Luogu not logged in");
    }
    static GetCaptcha = async (DB: Database, Username: string): Promise<Result> => {
        const CaptchaArrayBuffer: ArrayBuffer = await this.Fetch(DB, Username, "https://www.luogu.com.cn/lg4/captcha")
            .then(ResponseData => ResponseData.arrayBuffer());
        const CaptchaBase64 = "data:image/jpeg;base64," + base64js.fromByteArray(new Uint8Array(CaptchaArrayBuffer));
        return new Result(true, "Got captcha", { CaptchaBase64 });
    }
    static Login = async (DB: Database, Username: string, Captcha: string): Promise<Result> => {
        const UserInfo = ThrowErrorIfFailed(await DB.Select("Users", ["LuoguUsername", "LuoguPassword",], { Username, }))["Results"];
        if (UserInfo.length == 0) return new Result(false, "User not found");
        const LuoguUsername: string = UserInfo[0]["LuoguUsername"];
        const LuoguPassword: string = UserInfo[0]["LuoguPassword"];
        const LoginResponseData = await this.Fetch(DB, Username, "https://www.luogu.com.cn/do-auth/password", {
            "headers": {
                "accept": "application/json",
                "content-type": "application/json",
            },
            "body": JSON.stringify({
                "username": LuoguUsername,
                "password": LuoguPassword,
                "captcha": Captcha,
            }),
            "method": "POST"
        }).then(ResponseData => {
            return ResponseData.json();
        });
        if (LoginResponseData["errorCode"] != null) {
            return new Result(false, "Login failed: " + LoginResponseData["errorMessage"]);
        }
        if (LoginResponseData["locked"] == true) {
            return new Result(true, "Account locked", { "Locked": true });
        }
        return new Result(true, "Logged in", { "Locked": false });
    }
    static GetProblemList = async (DB: Database, Difficulty: Number): Promise<Result> => {
        let ProblemList = ThrowErrorIfFailed(await DB.Select("LuoguProblems", [], { Difficulty }))["Results"];
        return new Result(true, "Got problem list", { ProblemList });
    }
    static RefreshProblemList = async (DB: Database, Username: string): Promise<Result> => {
        ThrowErrorIfFailed(await DB.Delete("LuoguProblems"));

        let ProblemPages = ThrowErrorIfFailed(await this.Fetch(DB, Username, "https://www.luogu.com.cn/problem/list?_contentOnly=1", {
        }).then(ResponseData => ResponseData.json()).then(LuoguResponse => {
            if (LuoguResponse["code"] != 200)
                return new Result(false, "Luogu get problem list failed with error: " + LuoguResponse["code"]);
            return new Result(true, "Got problem pages", {
                ProblemPages: Math.ceil(LuoguResponse["currentData"]["problems"]["count"] / LuoguResponse["currentData"]["problems"]["perPage"]),
            })
        }))["ProblemPages"];
        let TryList = new Queue<object>();
        for (let i = 0; i < ProblemPages; i++) TryList.add({ "Index": i, "TriedTimes": 0 });
        let Finished: number = 0;
        let WaitCounter: number = 0;
        let ProblemCount: number = 0;

        while (TryList.size() > 0) {
            (async (Data) => {
                const Index = Data["Index"];
                const TriedTimes = Data["TriedTimes"];
                if (TriedTimes > 10) {
                    throw new Result(false, "Get problem page " + Index + " failed more than 10 times");
                }
                const LuoguResponse = await this.Fetch(DB, Username, "https://www.luogu.com.cn/problem/list?page=" + (Index + 1) + "&_contentOnly=1").then(ResponseData => ResponseData.json()).catch(e => {
                    Output.Warn("Getting problem page " + Index + " triggered rate limit");
                    TryList.add({ "Index": Index, "TriedTimes": TriedTimes + 1 });
                    Finished++;
                    return;
                });
                if (LuoguResponse["code"] != 200)
                    Output.Error("Luogu get problem list failed with error: " + LuoguResponse["code"]);
                else
                    for (let i = 0; i < LuoguResponse["currentData"]["problems"]["result"].length; i++) {
                        const Problem = LuoguResponse["currentData"]["problems"]["result"][i];
                        ThrowErrorIfFailed(await DB.Insert("LuoguProblems", {
                            "PID": Problem["pid"],
                            "Title": Problem["title"],
                            "PassRate": Problem["totalSubmit"] == 0 ? 0 : Problem["totalAccepted"] / Problem["totalSubmit"],
                            "Difficulty": Problem["difficulty"],
                        }));
                        ProblemCount++;
                    }
                Finished++;
            })(TryList.poll()!);
            WaitCounter++;
            if (WaitCounter % 16 == 0) {
                while (Finished != WaitCounter) await new Promise((resolve) => setTimeout(resolve, 10));
                WaitCounter = 0, Finished = 0;
            }
        }

        return new Result(true, "Problem list refreshed, currently " + ProblemCount + " problems");
    }
    static GetLastACDetail = async (DB: Database, Username: string, PID: string): Promise<Result> => {
        const UserInfo: Array<any> = ThrowErrorIfFailed(await DB.Select("Users", ["LuoguUsername",], { Username, }))["Results"];
        if (UserInfo.length == 0) return new Result(false, "User not found");
        const LuoguUsername: string = UserInfo[0]["LuoguUsername"];
        const RecordListInfo: object = await this.Fetch(DB, Username, `https://www.luogu.com.cn/record/list?pid=${PID}&user=` + LuoguUsername + "&status=12&orderBy=0&page=1&_contentOnly=1").then(async (ResponseData) => {
            const htmlText = await ResponseData.text();

            return JSON.parse(htmlText);
        }).catch(e => {
            throw new Result(false, `Luogu request failed: ${e}`);
        });
        if (RecordListInfo["code"] != 200) {
            return new Result(false, "Get last ac detail failed: " + RecordListInfo["currentData"]["errorMessage"]);
        }
        let RecordData: Array<any> = RecordListInfo["currentData"]["records"]["result"];
        RecordData = RecordData.filter((a: any) => {
            return (a.language >= 2 && a.language <= 4) || (a.language >= 11 && a.language <= 12) || (a.language >= 27 && a.language <= 28);
        });
        if (RecordData.length == 0) {
            return new Result(false, "No such record");
        }
        RecordData.sort((a: any, b: any) => {
            if (a["time"] != b["time"]) {
                return a["time"] > b["time"] ? 1 : -1;
            }
            else if (a["memory"] != b["memory"]) {
                return a["memory"] > b["memory"] ? 1 : -1;
            }
            else if (a["sourceCodeLength"] != b["sourceCodeLength"]) {
                return a["sourceCodeLength"] > b["sourceCodeLength"] ? 1 : -1;
            }
            return 0;
        });
        return new Result(true, "Got last AC detail", {
            Username,
            "Time": RecordData[0]["time"],
            "Memory": RecordData[0]["memory"],
            "SourceCodeLength": RecordData[0]["sourceCodeLength"],
            "SID": RecordData[0]["id"],
        });
    }
}
