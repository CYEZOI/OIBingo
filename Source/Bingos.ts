import { Database } from "./Database";
import { Luogu } from "./Luogu";
import { Output } from "./Output";
import { Result, ThrowErrorIfFailed } from "./Result";

export class Bingo {
    static ImportBingo = async (DB: Database): Promise<Result> => {
        const BingoRestoreData = {
            "简单题": [
                "P7915", "P1081", "P1973", "P1398", "P4954",
                "P1196", "P1955", "P1966", "P3605", "P3960",
                "P8518", "P4156", "P7739", "P2042", "P4391",
                "P3435", "P4867", "P3203", "P7828", "P6272",
                "P2611", "P8316", "P6326", "P4247", "P4092",
            ]
        };
        for (const BingoName in BingoRestoreData) {
            const BingoData = BingoRestoreData[BingoName];
            const NewBingoData: Array<any> = [];
            for (const i in BingoData) {
                const PID = BingoData[i];
                const ProblemInfo = ThrowErrorIfFailed(await DB.Select("LuoguProblems", [], { PID }))["Results"];
                if (ProblemInfo.length == 0) {
                    NewBingoData.push({
                        Problem: { PID, Title: "Problem not found in Luogu main database", PassRate: 0, Difficulty: 0 },
                        SubmitRecords: []
                    });
                    continue;
                }
                const Title = ProblemInfo[0]["Title"];
                const PassRate = ProblemInfo[0]["PassRate"];
                const Difficulty = ProblemInfo[0]["Difficulty"];
                NewBingoData.push({
                    Problem: { PID, Title, PassRate, Difficulty },
                    SubmitRecords: []
                });
            }
            ThrowErrorIfFailed(await DB.Insert("Bingos", {
                BingoName,
                BingoData: JSON.stringify(NewBingoData),
                Winner: ""
            }));
        }
        return new Result(true, "Restored bingo");
    }
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
        ThrowErrorIfFailed(await DB.Insert("Bingos", {
            BingoName,
            BingoData: JSON.stringify(BingoData),
            Winner: "",
        }));
        return new Result(true, "Created bingo");
    }
    static GetBingo = async (DB: Database, BingoName: string): Promise<Result> => {
        let BingoInfo = ThrowErrorIfFailed(await DB.Select("Bingos", [], { BingoName, }))["Results"];
        if (BingoInfo.length === 0) return new Result(false, "Bingo not found");
        return new Result(true, "Got bingo", { BingoInfo: BingoInfo[0] });
    }
    static GetBingoList = async (DB: Database, OnlyNoWin: boolean): Promise<Result> => {
        let BingoData = null;
        if (OnlyNoWin)
            BingoData = ThrowErrorIfFailed(await DB.Select("Bingos", [], { Winner: "" }))["Results"];
        else
            BingoData = ThrowErrorIfFailed(await DB.Select("Bingos", [], { Winner: { Operator: "!=", Value: "" } }))["Results"];
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
    };
    static CheckWin = async (DB: Database, BingoName: string, Username: string): Promise<Result> => {
        let BingoInfo = ThrowErrorIfFailed(await DB.Select("Bingos", [], { BingoName, }))["Results"];
        if (BingoInfo.length === 0) return new Result(false, "Bingo not found");
        let BingoData = JSON.parse(BingoInfo[0]["BingoData"]);
        const IsOccupy = (Index: number): boolean => {
            return BingoData[Index]["SubmitRecords"].length > 0 && BingoData[Index]["SubmitRecords"][0]["Username"] == Username;
        };
        if ((IsOccupy(0) && IsOccupy(5) && IsOccupy(10) && IsOccupy(15) && IsOccupy(20)) ||
            (IsOccupy(1) && IsOccupy(6) && IsOccupy(11) && IsOccupy(16) && IsOccupy(21)) ||
            (IsOccupy(2) && IsOccupy(7) && IsOccupy(12) && IsOccupy(17) && IsOccupy(22)) ||
            (IsOccupy(3) && IsOccupy(8) && IsOccupy(13) && IsOccupy(18) && IsOccupy(23)) ||
            (IsOccupy(4) && IsOccupy(9) && IsOccupy(14) && IsOccupy(19) && IsOccupy(24)) ||
            (IsOccupy(0) && IsOccupy(1) && IsOccupy(2) && IsOccupy(3) && IsOccupy(4)) ||
            (IsOccupy(5) && IsOccupy(6) && IsOccupy(7) && IsOccupy(8) && IsOccupy(9)) ||
            (IsOccupy(10) && IsOccupy(11) && IsOccupy(12) && IsOccupy(13) && IsOccupy(14)) ||
            (IsOccupy(15) && IsOccupy(16) && IsOccupy(17) && IsOccupy(18) && IsOccupy(19)) ||
            (IsOccupy(20) && IsOccupy(21) && IsOccupy(22) && IsOccupy(23) && IsOccupy(24)) ||
            (IsOccupy(0) && IsOccupy(6) && IsOccupy(12) && IsOccupy(18) && IsOccupy(24)) ||
            (IsOccupy(4) && IsOccupy(8) && IsOccupy(12) && IsOccupy(16) && IsOccupy(20))) {
            ThrowErrorIfFailed(await DB.Update("Bingos", { Winner: Username }, { BingoName }));
        }
        return new Result(true, "Win checked");
    };
}
