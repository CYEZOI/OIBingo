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
        Login: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {
                Username: "string",
                Password: "string",
            }));
            ThrowErrorIfFailed(await Users.CheckUsernameAndPassword(this.DB, this.APIParams["Username"], this.APIParams["Password"]));
            ThrowErrorIfFailed(await Users.UpdateOnlineTime(this.DB, this.APIParams["Username"]));
            const TokenValue: string = ThrowErrorIfFailed(await Token.CreateToken(this.DB, this.APIParams["Username"]))["TokenValue"];
            const IsAdmin: boolean = ThrowErrorIfFailed(await Users.GetUserPermission(this.DB, this.APIParams["Username"]))["Permission"];
            return new Result(true, "Login success", { Token: TokenValue, IsAdmin });
        },
        Logout: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {}));
            ThrowErrorIfFailed(await Token.DeleteToken(this.DB, this.Auth["Token"]));
            return new Result(true, "Logout success");
        },
        GetSettings: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {}));
            return await Users.GetLuoguSettings(this.DB, this.Auth["Username"]);
        },
        SetSettings: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {
                LuoguUsername: "string",
                LuoguPassword: "string",
            }));
            return await Users.SetLuoguSettings(this.DB, this.Auth["Username"], this.APIParams["LuoguUsername"], this.APIParams["LuoguPassword"]);
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
        UpdateUser: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {
                "Username": "string",
                "Password": "string",
                "LuoguUsername": "string",
                "LuoguPassword": "string",
                "Permission": "number",
            }));
            return await Users.UpdateUser(this.DB,
                this.APIParams["Username"],
                this.APIParams["Password"],
                this.APIParams["LuoguUsername"],
                this.APIParams["LuoguPassword"],
                this.APIParams["Permission"],
            );
        },
        CreateBingo: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {
                "Name": "string",
                "Difficulties": "object",
            }));
            return await Bingo.CreateBingo(this.DB, this.APIParams["Name"], this.APIParams["Difficulties"]);
        },
        GetBingos: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {}));
            const TempBingoList = ThrowErrorIfFailed(await Bingo.GetBingoList(this.DB))["BingoList"];
            for (let i = 0; i < TempBingoList.length; i++) {
                TempBingoList[i]["BingoData"] = JSON.parse(TempBingoList[i]["BingoData"]);
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
            return await Luogu.RefreshProblemList(this.DB);
        },
        GetLuoguCaptcha: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {}));
            const LuoguCookies = ThrowErrorIfFailed(await Luogu.GetCookiesByUsername(this.DB, this.Auth["Username"]))["Cookies"];
            return await Luogu.GetCaptcha(this.DB, LuoguCookies);
        },
        CheckLuoguLogin: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {}));
            const LuoguCookies = ThrowErrorIfFailed(await Luogu.GetCookiesByUsername(this.DB, this.Auth["Username"]))["Cookies"];
            return await Luogu.CheckLogin(this.DB, LuoguCookies);
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
        BingoSubmit: async (): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(this.APIParams, {
                BingoName: "string",
                PID: "string",
            }));
            const LuoguCookies = ThrowErrorIfFailed(await Luogu.GetCookiesByUsername(this.DB, this.Auth["Username"]))["Cookies"];
            const LastACDetail = ThrowErrorIfFailed(await Luogu.GetLastACDetail(this.DB, LuoguCookies, this.Auth["Username"], this.APIParams["PID"]));
            ThrowErrorIfFailed(await Bingo.UpdateBingo(this.DB, this.APIParams["BingoName"], this.APIParams["PID"], LastACDetail));
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
            if (this.ProcessFunctions[this.APIName] === undefined) {
                throw new Result(false, "The page you are trying to access does not exist");
            }
            const NoLoginAPIWhitelist = [
                "CheckTokenAvailable",
                "Login",
            ];
            const AdminAPIBlackList = [
                "GetUsers",
                "AddUser",
                "UpdateUser",
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
                if (ThrowErrorIfFailed(await Users.GetUserPermission(this.DB, this.Auth["Username"]))["Permission"] != 1) {
                    throw new Result(false, "You are not administrator");
                }
            }
            throw await this.ProcessFunctions[this.APIName]();
        } catch (ResponseData) {
            if (!(ResponseData instanceof Result)) {
                ResponseData = new Result(false, "Server error: " + String(ResponseData).split("\n")[0]);
            }
            (ResponseData.Success ? Output.Debug : Output.Warn)("API response: " + ResponseData);
            return ResponseData;
        }
    }
}
