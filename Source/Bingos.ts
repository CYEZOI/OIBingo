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
        const BingoProblemList = new Array<any>;
        for (let i = 0; i < 25; i++) {
            BingoProblemList.push(ProblemList.splice(Math.ceil(Math.random() * ProblemList.length), 1)[0]);
        }
        DB.Insert("Bingos", {
            BingoName,
            "BingoData": JSON.stringify(BingoProblemList),
            "CreateTime": new Date().getTime(),
        })
        return new Result(true, "Created bingo");
    }
    static GetBingoList = async (DB: Database): Promise<Result> => {
        let BingoData = ThrowErrorIfFailed(await DB.Select("Bingos", []))["Results"];
        return new Result(true, "Got bingo list", { "BingoList": BingoData });
    }
}