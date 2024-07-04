import { Result, ThrowErrorIfFailed } from "./Result";
import { Output } from "./Output";
import { Utilities } from "./Utilities";
import { Users } from "./Users";
import { Database } from "./Database";
import { Token } from "./Token";

export class API {
    private DB: Database;
    private APIName: string;
    private APIParams: object;
    private Auth: object;
    private ProcessFunctions = {
        CheckTokenAvailable: async (Data: object): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(Data, {
                Token: "string",
            }));
            return await Token.CheckToken(this.DB, Data["Token"]);
        },
        Login: async (Data: object): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(Data, {
                Username: "string",
                Password: "string",
            }));
            ThrowErrorIfFailed(await Users.CheckUsernameAndPassword(this.DB, Data["Username"], Data["Password"]));
            const TokenValue: string = ThrowErrorIfFailed(await Token.CreateToken(this.DB, Data["Username"]))["TokenValue"];
            const IsAdmin: boolean = ThrowErrorIfFailed(await Users.GetUserPermission(this.DB, Data["Username"]))["Permission"];
            return new Result(true, "Login success", { Token: TokenValue, IsAdmin });
        },
        Logout: async (Data: object): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(Data, {
                Token: "string"
            }));
            ThrowErrorIfFailed(await Token.DeleteToken(this.DB, Data["Token"]));
            return new Result(true, "Logout success");
        },
        GetBingo: async (Data: object): Promise<Result> => {
            return new Result(true, "Nothing");
        },
        GetSettings: async (Data: object): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(Data, {}));
            return await Users.GetLuoguSettings(this.DB, this.Auth["Username"]);
        },
        SetSettings: async (Data: object): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(Data, {
                LuoguUsername: "string",
                LuoguPassword: "string",
            }));
            return await Users.SetLuoguSettings(this.DB, this.Auth["Username"], Data["LuoguUsername"], Data["LuoguPassword"]);
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
            ];
            if (NoLoginAPIWhitelist.find((ElementData) => ElementData === this.APIName) === undefined) {
                ThrowErrorIfFailed(Utilities.CheckParams(this.Auth, {
                    "Token": "string",
                }));
                ThrowErrorIfFailed(await Token.CheckToken(this.DB, this.Auth["Token"]));
                this.Auth["Username"] = ThrowErrorIfFailed(await Token.GetUsernameByToken(this.DB, this.Auth["Token"]))["Username"];
            }
            throw await this.ProcessFunctions[this.APIName](this.APIParams);
        } catch (ResponseData) {
            if (!(ResponseData instanceof Result)) {
                Output.Error(ResponseData);
                ResponseData = new Result(false, "Server error: " + String(ResponseData).split("\n")[0]);
            }
            (ResponseData.Success ? Output.Log : Output.Warn)("API response: " + ResponseData);
            return ResponseData;
        }
    }
}
