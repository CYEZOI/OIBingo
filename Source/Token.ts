import { Database } from "./Database";
import { Result, ThrowErrorIfFailed } from "./Result";
import { Utilities } from "./Utilities";

export class Token {
    static TokenExpireTime = 1000 * 60 * 60 * 24;
    static CreateToken = async (DB: Database, Username: string): Promise<Result> => {
        const TokenValue: string = Utilities.GenerateRandomString(32, "012346789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
        ThrowErrorIfFailed(await DB.Insert("Tokens", {
            TokenValue, Username,
            CreateTime: new Date().getTime(),
        }));
        return new Result(true, "Token created", { TokenValue });
    }
    static CheckToken = async (DB: Database, TokenValue: string): Promise<Result> => {
        const TokenInfo = ThrowErrorIfFailed(await DB.Select("Tokens", ["CreateTime"], { TokenValue, }))["Results"];
        if (TokenInfo.length === 0) return new Result(false, "Token not found");
        if (new Date().getTime() - TokenInfo[0]["CreateTime"] >= this.TokenExpireTime) {
            this.DeleteToken(DB, TokenValue);
            return new Result(false, "Token expired");
        }
        return new Result(true, "Token is correct");
    }
    static GetUsernameByToken = async (DB: Database, TokenValue: string): Promise<Result> => {
        const TokenInfo = ThrowErrorIfFailed(await DB.Select("Tokens", ["Username"], { TokenValue, }))["Results"];
        if (TokenInfo.length === 0) return new Result(false, "Token not found");
        if (new Date().getTime() - TokenInfo[0]["CreateTime"] >= this.TokenExpireTime) {
            this.DeleteToken(DB, TokenValue);
            return new Result(false, "Token expired");
        }
        return new Result(true, "Got username", { "Username": TokenInfo[0]["Username"], });
    }
    static DeleteToken = async (DB: Database, TokenValue: string): Promise<Result> => {
        ThrowErrorIfFailed(await DB.Delete("Tokens", { TokenValue, }));
        return new Result(true, "Token deleted");
    }
};