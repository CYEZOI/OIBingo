import { Result, ThrowErrorIfFailed } from "./Result";
import { Output } from "./Output";
import { Utilities } from "./Utilities";
import { Users } from "./Users";
import { Database } from "./Database";
import { Token } from "./Token";
import { Bingo } from "./Bingos";
import { Luogu } from "./Luogu";

export class API {
    private DB: Database;
    private APIName: string;
    private APIParams: object;
    private Auth: object;
    private ProcessFunctions = {
        CheckTokenAvailable: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {
                Token: "string",
            }));
            return await Token.CheckToken(this.DB, this.APIParams["Token"]);
        },
        Register: async (): Promise<Result> => {
            // return new Result(false, "Register banned");
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {
                Username: "string",
                Password: "string",
            }));
            ThrowErrorIfFailed(await Users.AddUser(this.DB, this.APIParams["Username"], this.APIParams["Password"]));
            ThrowErrorIfFailed(await Users.UpdateOnlineTime(this.DB, this.APIParams["Username"]));
            return new Result(true, "Register success");
        },
        Login: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {
                Username: "string",
                Password: "string",
            }));
            ThrowErrorIfFailed(await Users.CheckUsernameAndPassword(this.DB, this.APIParams["Username"], this.APIParams["Password"]));
            ThrowErrorIfFailed(await Users.UpdateOnlineTime(this.DB, this.APIParams["Username"]));
            const UserPermission: number = ThrowErrorIfFailed(await Users.GetUser(this.DB, this.APIParams["Username"]))["Permission"];
            if (UserPermission == 2) {
                return new Result(false, "User banned");
            }
            const TokenValue: string = ThrowErrorIfFailed(await Token.CreateToken(this.DB, this.APIParams["Username"]))["TokenValue"];
            return new Result(true, "Login success", { Token: TokenValue, IsAdmin: UserPermission == 1 });
        },
        Logout: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {}));
            ThrowErrorIfFailed(await Token.DeleteToken(this.DB, this.Auth["Token"]));
            return new Result(true, "Logout success");
        },
        GetSettings: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {}));
            const UserInfo = ThrowErrorIfFailed(await Users.GetUser(this.DB, this.Auth["Username"]));
            return new Result(true, "Got settings", {
                LuoguUsername: UserInfo["LuoguUsername"],
                LuoguPassword: UserInfo["LuoguPassword"],
                Color: UserInfo["Color"],
                Avatar: UserInfo["Avatar"],
            });
        },
        SetSettings: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {
                LuoguUsername: "string",
                LuoguPassword: "string",
                Color: "string",
                Avatar: "string",
            }));
            return await Users.SetSettings(this.DB, this.Auth["Username"], this.APIParams["LuoguUsername"], this.APIParams["LuoguPassword"], this.APIParams["Color"], this.APIParams["Avatar"]);
        },
        GetUsers: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {}));
            return await Users.GetUsers(this.DB);
        },
        AddUser: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {
                "Username": "string",
                "Password": "string",
            }));
            return await Users.AddUser(this.DB,
                this.APIParams["Username"],
                this.APIParams["Password"],
            );
        },
        UpdatePermission: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {
                "Username": "string",
                "Permission": "number",
            }));
            return await Users.UpdatePermission(this.DB,
                this.APIParams["Username"],
                this.APIParams["Permission"],
            );
        },
        ImportBingo: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {}));
            return await Bingo.ImportBingo(this.DB);
        },
        CreateBingo: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {
                "Name": "string",
                "Difficulties": "object",
            }));
            return await Bingo.CreateBingo(this.DB, this.APIParams["Name"], this.APIParams["Difficulties"]);
        },
        GetBingos: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {
                OnlyNoWin: "boolean",
            }));
            const TempBingoList = ThrowErrorIfFailed(await Bingo.GetBingoList(this.DB, this.APIParams["OnlyNoWin"]))["BingoList"];
            for (let i = 0; i < TempBingoList.length; i++) {
                TempBingoList[i]["BingoData"] = JSON.parse(TempBingoList[i]["BingoData"]);
                const BingoData = TempBingoList[i]["BingoData"];
                for (let j = 0; j < BingoData.length; j++) {
                    const SubmitRecords = BingoData[j]["SubmitRecords"];
                    for (let k = 0; k < SubmitRecords.length; k++) {
                        const Username = SubmitRecords[k]["Username"];
                        const UserInfo = ThrowErrorIfFailed(await Users.GetUser(this.DB, Username));
                        SubmitRecords[k]["Color"] = UserInfo["Color"];
                        SubmitRecords[k]["Avatar"] = UserInfo["Avatar"] || "https://image.langningchen.com/ybfthfouxdfxzeomllowmeidyqqvnyto";
                    }
                }
            }
            return new Result(true, "Got bingo list", { "BingoList": TempBingoList });
        },
        DeleteBingo: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {
                BingoName: "string"
            }));
            ThrowErrorIfFailed(await Bingo.DeleteBingo(this.DB, this.APIParams["BingoName"]));
            return new Result(true, "Bingo deleted");
        },
        RefreshProblemList: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {}));
            return await Luogu.RefreshProblemList(this.DB, this.Auth["Username"]);
        },
        GetLuoguCaptcha: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {}));
            return await Luogu.GetCaptcha(this.DB, this.Auth["Username"]);
        },
        CheckLuoguLogin: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {}));
            return await Luogu.CheckLogin(this.DB, this.Auth["Username"]);
        },
        ResetLuoguToken: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {
                "Username": "string",
            }));
            ThrowErrorIfFailed(await Luogu.GenerateNewCookies(this.DB, this.APIParams["Username"]));
            return new Result(true, "Reset luogu token");
        },
        LuoguLogin: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {
                Captcha: "string",
            }));
            return await Luogu.Login(this.DB, this.Auth["Username"], this.APIParams["Captcha"]);
        },
        BingoSubmitAll: async (): Promise<Result> => {
            // return new Result(false, "BingoSubmitAll banned");
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, { BingoName: "string", }));
            if (ThrowErrorIfFailed(await Bingo.GetBingo(this.DB, this.APIParams["BingoName"]))["BingoInfo"]["Winner"] != "")
                return new Result(false, "Bingo has winner");
            const BingoData = JSON.parse(ThrowErrorIfFailed(await Bingo.GetBingo(this.DB, this.APIParams["BingoName"]))["BingoInfo"]["BingoData"]);
            for (const i in BingoData) {
                const PID = BingoData[i]["Problem"]["PID"];
                const GetLastACDetailResult = await Luogu.GetLastACDetail(this.DB, this.Auth["Username"], PID);
                if (GetLastACDetailResult.Success) {
                    ThrowErrorIfFailed(await Bingo.UpdateBingo(this.DB, this.APIParams["BingoName"], PID, GetLastACDetailResult.Data));
                }
            }
            ThrowErrorIfFailed(await Bingo.CheckWin(this.DB, this.APIParams["BingoName"], this.Auth["Username"]));
            return new Result(true, "Bingo submitted");
        },
        BingoSubmit: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {
                BingoName: "string",
                PID: "string",
            }));
            if (ThrowErrorIfFailed(await Bingo.GetBingo(this.DB, this.APIParams["BingoName"]))["BingoInfo"]["Winner"] != "")
                return new Result(false, "Bingo has winner");
            const LastACDetail = ThrowErrorIfFailed(await Luogu.GetLastACDetail(this.DB, this.Auth["Username"], this.APIParams["PID"]));
            ThrowErrorIfFailed(await Bingo.UpdateBingo(this.DB, this.APIParams["BingoName"], this.APIParams["PID"], LastACDetail));
            ThrowErrorIfFailed(await Bingo.CheckWin(this.DB, this.APIParams["BingoName"], this.Auth["Username"]));
            return new Result(true, "Bingo submitted");
        },
    };

    constructor(DB: Database, RequestJSON: object) {
        this.DB = DB;
        this.APIName = RequestJSON["APIName"];
        this.APIParams = RequestJSON["APIParams"];
        this.Auth = RequestJSON["Auth"];
        Output.Log("API request: " + JSON.stringify(RequestJSON));
    }

    public async Process(): Promise<object> {
        try {
            // throw new Result(false, "System is under maintaining now");
            if (this.ProcessFunctions[this.APIName] === undefined) {
                throw new Result(false, "The page you are trying to access does not exist");
            }
            const NoLoginAPIWhitelist = [
                "CheckTokenAvailable",
                "Register",
                "Login",
            ];
            const AdminAPIBlackList = [
                "GetUsers",
                "AddUser",
                "UpdatePermission",
                "ImportBingo",
                "CreateBingo",
                "DeleteBingo",
                "RefreshProblemList",
                "ResetLuoguToken",
            ];
            if (NoLoginAPIWhitelist.find((ElementData) => ElementData === this.APIName) === undefined) {
                ThrowErrorIfFailed(Utilities.CheckParams(this.Auth, {
                    "Token": "string",
                }));
                ThrowErrorIfFailed(await Token.CheckToken(this.DB, this.Auth["Token"]));
                this.Auth["Username"] = ThrowErrorIfFailed(await Token.GetUsernameByToken(this.DB, this.Auth["Token"]))["Username"];
                ThrowErrorIfFailed(await Users.UpdateOnlineTime(this.DB, this.Auth["Username"]));
            }
            if (AdminAPIBlackList.find((ElementData) => ElementData === this.APIName) !== undefined) {
                if (ThrowErrorIfFailed(await Users.GetUser(this.DB, this.Auth["Username"]))["Permission"] != 1) {
                    throw new Result(false, "You are not administrator");
                }
            }
            throw await this.ProcessFunctions[this.APIName]();
        } catch (ResponseData) {
            if (!(ResponseData instanceof Result)) {
                ResponseData = new Result(false, "Server error: " + String(ResponseData).split("\n")[0]);
            }
            (ResponseData.Success ? Output.Debug : Output.Error)("API response: " + ResponseData);
            return ResponseData;
        }
    }
}
