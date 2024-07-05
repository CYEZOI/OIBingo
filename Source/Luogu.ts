import { Queue } from "typescript-queue";
import { Database } from "./Database";
import { Output } from "./Output";
import { Result, ThrowErrorIfFailed } from "./Result";

export class Luogu {
    static GetProblemList = async (DB: Database, Difficulty: Number): Promise<Result> => {
        let ProblemList = ThrowErrorIfFailed(await DB.Select("LuoguProblems", [], { Difficulty }))["Results"];
        return new Result(true, "Got problem list", { ProblemList });
    }
    static RefreshProblemList = async (DB: Database): Promise<Result> => {
        ThrowErrorIfFailed(await DB.Delete("LuoguProblems"));

        let ProblemPages = ThrowErrorIfFailed(await fetch("https://www.luogu.com.cn/problem/list?_contentOnly=1").then(ResponseData => ResponseData.json()).then(LuoguResponse => {
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

        while (TryList.size() > 0) {
            (async (Data) => {
                const Index = Data["Index"];
                const TriedTimes = Data["TriedTimes"];
                if (TriedTimes > 10) {
                    throw new Result(false, "Get problem page " + Index + " failed more than 10 times");
                }
                const Timeout = new AbortController();
                const LuoguResponse = await fetch("https://www.luogu.com.cn/problem/list?page=" + (Index + 1) + "&_contentOnly=1", {
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
                            "PassRate": Problem["totalAccepted"] / Problem["totalSubmit"],
                            "Difficulty": Problem["difficulty"],
                        }));
                    }
                Finished++;
            })(TryList.poll()!);
            WaitCounter++;
            if (WaitCounter % 16 == 0) {
                while (Finished != WaitCounter) await new Promise((resolve) => setTimeout(resolve, 10));
                WaitCounter = 0, Finished = 0;
            }
        }

        return new Result(true, "Problem list refreshed");
    }
}