import { Queue } from "typescript-queue";
import { Database } from "./Database";
import { Output } from "./Output";
import { Result, ThrowErrorIfFailed } from "./Result";
import * as base64js from "base64-js";

export class Luogu {
    static Fetch = async (URL: string, Options: RequestInit = {}): Promise<any> => {
        Options.redirect = "manual";
        const LuoguResponse = await fetch(URL, Options);
        const ResponseText = await LuoguResponse.text();
        var NewCookies = "";
        if (LuoguResponse.headers.get("set-cookie") != null) {
            const Cookies = LuoguResponse.headers.get("set-cookie")!.split(";");
            for (let i = 0; i < Cookies.length; i++) {
                if (Cookies[i].indexOf("C3VK") != -1) {
                    NewCookies = Cookies[i].substring(Cookies[i].indexOf("C3VK") + 5, Cookies[i].indexOf("C3VK") + 5 + 6);
                }
            }
        }
        if (ResponseText.indexOf("C3VK") != -1) {
            NewCookies = ResponseText.substring(ResponseText.indexOf("C3VK") + 5, ResponseText.indexOf("C3VK") + 5 + 6);
        }
        if (NewCookies) {
            console.log("Trigger protection, token: " + NewCookies);
            const OptionsNew = Options;
            if (OptionsNew.headers == null) OptionsNew.headers = {};
            OptionsNew.headers["cookie"] = (OptionsNew.headers["cookie"] ? OptionsNew.headers["cookie"] + "; " : "") + "C3VK=" + NewCookies;
            return await Luogu.Fetch(URL, OptionsNew);
        }
        return await fetch(URL, Options);
    };

    static GenerateNewCookies = async (DB: Database, Username: string): Promise<Result> => {
        ThrowErrorIfFailed(await DB.Update("Users", {
            "LuoguCookies": (await this.Fetch("https://www.luogu.com.cn/")).headers.getSetCookie().map((value: string) => {
                return value.split(";")[0];
            }).join(";")
        }, { Username }));
        return new Result(true, "Cookies set");
    }
    static GetCookiesByUsername = async (DB: Database, Username: string): Promise<Result> => {
        const UserInfo = ThrowErrorIfFailed(await DB.Select("Users", ["LuoguCookies",], { Username, }))["Results"];
        if (UserInfo.length == 0) return new Result(false, "User not found");
        return new Result(true, "Got cookies", { Cookies: UserInfo[0]["LuoguCookies"] });
    }
    static CheckLogin = async (DB: Database, Cookies: string): Promise<Result> => {
        if ((await this.Fetch("https://www.luogu.com.cn/chat?_contentOnly=1", {
            headers: { cookie: Cookies, }
        }).then(ResponseData => ResponseData.status)) == 200) {
            return new Result(true, "Luogu logged in");
        }
        return new Result(false, "Luogu not logged in");
    }
    static GetCaptcha = async (DB: Database, Cookies: string): Promise<Result> => {
        const CaptchaArrayBuffer: ArrayBuffer = await this.Fetch("https://www.luogu.com.cn/lg4/captcha", {
            headers: { cookie: Cookies, },
        }).then(ResponseData => ResponseData.arrayBuffer());
        const CaptchaBase64 = "data:image/jpeg;base64," + base64js.fromByteArray(new Uint8Array(CaptchaArrayBuffer));
        return new Result(true, "Got captcha", { CaptchaBase64 });
    }
    static Login = async (DB: Database, Username: string, Captcha: string): Promise<Result> => {
        const UserInfo = ThrowErrorIfFailed(await DB.Select("Users", ["LuoguUsername", "LuoguPassword",], { Username, }))["Results"];
        if (UserInfo.length == 0) return new Result(false, "User not found");
        const LuoguUsername: string = UserInfo[0]["LuoguUsername"];
        const LuoguPassword: string = UserInfo[0]["LuoguPassword"];
        const LuoguCookies: string = ThrowErrorIfFailed(await this.GetCookiesByUsername(DB, Username))["Cookies"];
        let LuoguUID: string = "";
        const LoginResponseData = await this.Fetch("https://www.luogu.com.cn/do-auth/password", {
            "headers": {
                "accept": "application/json",
                "content-type": "application/json",
                cookie: LuoguCookies,
            },
            "body": JSON.stringify({
                "username": LuoguUsername,
                "password": LuoguPassword,
                "captcha": Captcha,
            }),
            "method": "POST"
        }).then(ResponseData => {
            if (ResponseData.headers.getSetCookie().length > 0) {
                let CookieData = ResponseData.headers.getSetCookie()[0];
                LuoguUID = CookieData.substring(5, CookieData.indexOf(";"));
            }
            return ResponseData.json();
        });
        if (LoginResponseData["errorCode"] != null) {
            return new Result(false, "Login failed: " + LoginResponseData["errorMessage"]);
        }
        if (LoginResponseData["locked"] == true) {
            return new Result(true, "Account locked", { "Locked": true });
        }
        ThrowErrorIfFailed(await DB.Update("Users", {
            "LuoguCookies": LuoguCookies.substring(0, 58) + LuoguUID
        }, { Username }));
        return new Result(true, "Logged in", { "Locked": false });
    }
    static GetProblemList = async (DB: Database, Difficulty: Number): Promise<Result> => {
        let ProblemList = ThrowErrorIfFailed(await DB.Select("LuoguProblems", [], { Difficulty }))["Results"];
        return new Result(true, "Got problem list", { ProblemList });
    }
    static RefreshProblemList = async (DB: Database): Promise<Result> => {
        ThrowErrorIfFailed(await DB.Delete("LuoguProblems"));

        let ProblemPages = ThrowErrorIfFailed(await this.Fetch("https://www.luogu.com.cn/problem/list?_contentOnly=1", {
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
                const Timeout = new AbortController();
                const LuoguResponse = await this.Fetch("https://www.luogu.com.cn/problem/list?page=" + (Index + 1) + "&_contentOnly=1", {
                    signal: Timeout.signal,
                }).then(ResponseData => ResponseData.json()).catch(e => {
                    Output.Warn("Getting problem page " + Index + " triggered rate limit");
                    TryList.add({ "Index": Index, "TriedTimes": TriedTimes + 1 });
                    Finished++;
                    return;
                });
                setTimeout(() => {
                    Timeout.abort();
                }, 5000);
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
    static GetLastACDetail = async (DB: Database, Cookies: string, Username: string, PID: string): Promise<Result> => {
        const UserInfo: Array<any> = ThrowErrorIfFailed(await DB.Select("Users", ["LuoguUsername",], { Username, }))["Results"];
        if (UserInfo.length == 0) return new Result(false, "User not found");
        const LuoguUsername: string = UserInfo[0]["LuoguUsername"];
        const Timeout = new AbortController();
        const RecordListInfo: object = await this.Fetch(`https://www.luogu.com.cn/record/list?pid=${PID}&user=` + LuoguUsername + "&status=12&orderBy=0&page=1&_contentOnly=1", {
            headers: { cookie: Cookies, },
            signal: Timeout.signal
        }).then(async (ResponseData) => {
            const htmlText = await ResponseData.text();

            return JSON.parse(htmlText);
        }).catch(e => {
            throw new Result(false, `Luogu request failed: ${e}`);
        });
        setTimeout(() => {
            Timeout.abort();
            throw new Result(false, "Luogu request failed: Timeout");
        }, 5000);
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
