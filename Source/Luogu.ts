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

        const abortController = new AbortController();
        Options.signal = abortController.signal;
        setTimeout(() => { abortController.abort() }, 3000);

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
            (LuoguResponse.status == 302 &&
                ResponseText.indexOf("/auth/login") == -1)) {
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
    static Login = async (DB: Database, Username: string): Promise<Result> => {
        const UserInfo = ThrowErrorIfFailed(await DB.Select("Users", ["LuoguUsername", "LuoguPassword",], { Username, }))["Results"];
        if (UserInfo.length == 0) return new Result(false, "User not found");
        const LuoguUsername: string = UserInfo[0]["LuoguUsername"];
        const LuoguPassword: string = UserInfo[0]["LuoguPassword"];

        while (true) {
            const CaptchaArrayBuffer: ArrayBuffer = await this.Fetch(DB, Username, "https://www.luogu.com.cn/lg4/captcha")
                .then(ResponseData => ResponseData.arrayBuffer());
            const Captcha = await fetch("http://localhost:8080", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    "image": base64js.fromByteArray(new Uint8Array(CaptchaArrayBuffer)),
                }),
            }).then(ResponseData => ResponseData.json()).then(ResponseData => {
                if (ResponseData["prediction"] == null) {
                    throw new Result(false, "Captcha prediction failed: " + ResponseData["error"]);
                }
                return ResponseData["prediction"];
            }).catch(e => {
                throw new Result(false, "Captcha prediction failed: " + e);
            });

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
            console.log(LoginResponseData);
            if (LoginResponseData["errorCode"] != null) {
                if (LoginResponseData["errorMessage"] != "图形验证码错误") {
                    return new Result(false, "Login failed: " + LoginResponseData["errorMessage"]);
                }
            }
            else if (LoginResponseData["locked"] == true) {
                return new Result(true, "Account locked", { "Locked": true });
            }
            else {
                return new Result(true, "Logged in", { "Locked": false });
            }
        }
    }

    static hslToRgb(h: number, s: number, l: number): [number, number, number] {
        h /= 360;
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const hue2rgb = (t: number): number => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        return [
            Math.round(hue2rgb(h + 1 / 3) * 255),
            Math.round(hue2rgb(h) * 255),
            Math.round(hue2rgb(h - 1 / 3) * 255)
        ];
    }

    static UpdateAvatar = async (DB: Database, Username: string): Promise<Result> => {
        const UserInfo: Array<any> = ThrowErrorIfFailed(await DB.Select("Users", ["LuoguUsername",], { Username, }))["Results"];
        if (UserInfo.length == 0) return new Result(false, "User not found");
        const LuoguUsername: string = UserInfo[0]["LuoguUsername"];

        const LuoguResponse = await this.Fetch(DB, Username, "https://www.luogu.com.cn/api/user/search?keyword=" + LuoguUsername);
        const LuoguResponseData = await LuoguResponse.json();
        if (LuoguResponseData["users"].length == 0) {
            return new Result(false, "User not found");
        }
        const Avatar: string = LuoguResponseData["users"][0]["avatar"];
        if (Avatar == null || Avatar == "") {
            return new Result(false, "Avatar not found");
        }
        const AvatarResponse = await this.Fetch(DB, Username, Avatar, {
            redirect: "follow",
        });
        if (AvatarResponse.status != 200) {
            return new Result(false, "Avatar not found");
        }

        const data = new Uint8Array(await AvatarResponse.arrayBuffer());

        let hash = 2166136261;
        for (let i = 0; i < data.length; i++) {
            hash ^= data[i];
            hash = (hash * 16777619) >>> 0;
        }

        const hue = (hash & 0xFFFFFF) / 0xFFFFFF * 360;
        const saturation = 0.65 + ((hash >>> 8) & 0xFF) / 0xFF * 0.25;
        const lightness = 0.45 + ((hash >>> 16) & 0xFF) / 0xFF * 0.2;

        const [r, g, b] = this.hslToRgb(hue, saturation, lightness);
        const Color = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

        ThrowErrorIfFailed(await DB.Update("Users", { Avatar, Color }, { Username }))["Results"];
        return new Result(true, "Avatar updated", { Avatar, Color });
    }
    static GetProblemList = async (DB: Database, Difficulty: Number): Promise<Result> => {
        let ProblemList = ThrowErrorIfFailed(await DB.Select("LuoguProblems", [], { Difficulty }))["Results"];
        return new Result(true, "Got problem list", { ProblemList });
    }
    static RefreshProblemList = async (DB: Database, Username: string): Promise<Result> => {
        ThrowErrorIfFailed(await DB.Delete("LuoguProblems"));

        let ProblemPages = ThrowErrorIfFailed(await this.Fetch(DB, Username, "https://www.luogu.com.cn/problem/list?type=P&_contentOnly=1", {
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
                const LuoguResponse = await this.Fetch(DB, Username, "https://www.luogu.com.cn/problem/list?type=P&page=" + (Index + 1) + "&_contentOnly=1").then(ResponseData => ResponseData.json()).catch(e => {
                    Output.Warn("Getting problem page " + Index + " triggered rate limit");
                    TryList.add({ "Index": Index, "TriedTimes": TriedTimes + 1 });
                    Finished++;
                    return;
                });
                console.log("Got problem page " + Index + " of " + ProblemPages);
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
            if (WaitCounter % 1 == 0) {
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
