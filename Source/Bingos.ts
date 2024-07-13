import { Database } from "./Database";
import { Luogu } from "./Luogu";
import { Output } from "./Output";
import { Result, ThrowErrorIfFailed } from "./Result";

export class Bingo {
    static RestoreBingo = async (DB: Database): Promise<Result> => {
        const BingoRestoreData = { "提高+/省选-": ["P1858", "P3362", "P4796", "P2673", "P10119", "P4870", "P6104", "P6374", "P9191", "P2841", "P2894", "P1053", "P6855", "P3492", "P6513", "P2950", "P1127", "P2747", "P10036", "P6028", "P7959", "P4665", "P3868", "P2636", "P2674"], "普及+/提高": ["P2359", "P6538", "P4047", "P1363", "P1310", "P1052", "P3063", "P1668", "P4401", "P2476", "P6464", "P8858", "P1191", "P10118", "P3956", "P5560", "P6601", "P3205", "P1982", "B3734", "P1655", "P6732", "P2363", "P4816", "P8509"], "大杂烩": ["P4406", "P2330", "P8187", "B3721", "P4933", "P6493", "P6920", "P1417", "P2194", "P9396", "P2905", "P9010", "P7619", "P8634", "P7559", "P8595", "P1091", "B2024", "P8846", "P9634", "P1197", "P7355", "P4654", "P6108", "P9972"], "大杂烩2": ["P3935", "P1966", "P4175", "P9056", "P10398", "P1424", "P2673", "P4086", "P1577", "P2558", "P2023", "P8936", "P2981", "P3443", "P4053", "P9881", "P6560", "P9023", "B3834", "P9100", "P10299", "P9269", "P2518", "P7763", "P8247"], "NOI/NOI+/CTSC": ["P8570", "P7719", "P5525", "P9070", "P1756", "P9419", "P1737", "P5111", "P6792", "P9312", "P1721", "P10065", "P7348", "P9442", "P5423", "P9353", "P4143", "P5225", "P3642", "P4250", "P10545", "P8337", "P9082", "P10028", "P4693"], "省选/NOI-": ["P9001", "P7336", "P5175", "P6302", "P3305", "P4745", "P3471", "P4750", "P1667", "P1393", "P9970", "P6915", "P10212", "P2252", "P6860", "P3953", "P7597", "P2045", "P7931", "P5977", "P4858", "P3350", "P3967", "P4245", "P5350"], "篮子黑": ["P4820", "P5851", "P3112", "P6644", "P1813", "P9792", "P2860", "P4321", "P7118", "P3219", "P3400", "P8351", "P3881", "P9432", "P3489", "P6622", "P9212", "P1108", "P3683", "P7396", "P6563", "P3161", "P6232", "P10563", "P7944"] };
        for (const BingoName in BingoRestoreData) {
            const BingoData = BingoRestoreData[BingoName];
            const NewBingoData: Array<any> = [];
            for (const i in BingoData) {
                const PID = BingoData[i];
                const ProblemInfo = ThrowErrorIfFailed(await DB.Select("LuoguProblems", [], { PID }))["Results"];
                if (ProblemInfo.length == 0) {
                    NewBingoData.push({
                        Problem: { PID, Title: "Problem not found", PassRate: 0, Difficulty: 0 },
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
    };
    static CheckWin = async (DB: Database, BingoName: string, Username: string): Promise<Result> => {
        let BingoInfo = ThrowErrorIfFailed(await DB.Select("Bingos", [], { BingoName, }))["Results"];
        if (BingoInfo.length === 0) return new Result(false, "Bingo not found");
        let BingoData = JSON.parse(BingoInfo[0]["BingoData"]);
        const IsOccupy = (Index: number): boolean => {
            return BingoData[Index]["SubmitRecords"].length > 0 && BingoData[Index]["SubmitRecords"] == Username;
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