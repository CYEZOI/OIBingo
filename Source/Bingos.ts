import { Database } from "./Database";
import { Luogu } from "./Luogu";
import { Result, ThrowErrorIfFailed } from "./Result";

export class Bingo {
    static CreateBingo = async (DB: Database, BingoName: String, Difficulties: Array<Number>): Promise<Result> => {
        if (ThrowErrorIfFailed(await DB.GetTableSize("Bingos", { BingoName }))["TableSize"]) {
            return new Result(false, "Bingo already exits");
        }
        let ProblemList = new Array<any>;
        for (let i = 0; i < Difficulties.length; i++) {
            const Difficulty = Difficulties[i];
            ProblemList = ProblemList.concat(ThrowErrorIfFailed(await Luogu.GetProblemList(DB, Difficulty))["ProblemList"]);
        }
        if (ProblemList.length < 25) {
            return new Result(false, "Problem not enough for a Bingo");
        }
        const BingoData = new Array<any>;
        for (let i = 0; i < 25; i++) {
            const Problem = ProblemList.splice(Math.ceil(Math.random() * ProblemList.length), 1)[0];
            BingoData.push({
                Problem,
                "SubmitRecords": []
            });
        }
        DB.Insert("Bingos", {
            BingoName,
            "BingoData": JSON.stringify(BingoData),
            "CreateTime": new Date().getTime(),
        })
        return new Result(true, "Created bingo");
    }
    static GetBingoList = async (DB: Database): Promise<Result> => {
        let BingoData = ThrowErrorIfFailed(await DB.Select("Bingos", []))["Results"];
        return new Result(true, "Got bingo list", { "BingoList": BingoData });
    }
    static DeleteBingo = async (DB: Database, BingoName: string): Promise<Result> => {
        ThrowErrorIfFailed(await DB.Delete("Bingos", { BingoName, }));
        return new Result(true, "Bingo deleted");
    }
    static UpdateBingo = async (DB: Database, BingoName: string, PID: string, ACDetail: object): Promise<Result> => {
        let BingoInfo = ThrowErrorIfFailed(await DB.Select("Bingos", [], { BingoName, }))["Results"];
        if (BingoInfo.length === 0) return new Result(false, "Bingo not found");
        let BingoData = JSON.parse(BingoInfo[0]["BingoData"]);
        for (let i = 0; i < 25; i++) {
            if (BingoData[i]["Problem"]["PID"] == PID) {
                BingoData[i]["SubmitRecords"].push(ACDetail);
                BingoData[i]["SubmitRecords"].sort((a: any, b: any) => {
                    if (a["Time"] != b["Time"]) {
                        return a["Time"] > b["Time"] ? 1 : -1;
                    }
                    else if (a["Memory"] != b["Memory"]) {
                        return a["Memory"] > b["Memory"] ? 1 : -1;
                    }
                    else if (a["SourceCodeLength"] != b["SourceCodeLength"]) {
                        return a["SourceCodeLength"] > b["SourceCodeLength"] ? 1 : -1;
                    }
                    return 0;
                });
                let SubmitUserList: Array<string> = [];
                for (let j = 0; j < BingoData[i]["SubmitRecords"].length; j++) {
                    const Username: string = BingoData[i]["SubmitRecords"][j]["Username"];
                    if (SubmitUserList.indexOf(Username) == -1) {
                        SubmitUserList.push(Username);
                    }
                    else {
                        BingoData[i]["SubmitRecords"].splice(j, 1);
                        j--;
                    }
                }
            }
        }
        ThrowErrorIfFailed(await DB.Update("Bingos", { BingoData: JSON.stringify(BingoData), }, { BingoName, }))["Results"];
        return new Result(true, "Bingo updated");
    }
}