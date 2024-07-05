import { Database } from "./Database";
import { Result, ThrowErrorIfFailed } from "./Result";

export class Users {
    static CheckUsernameAndPassword = async (DB: Database, Username: string, Password: string): Promise<Result> => {
        let UserInfo = ThrowErrorIfFailed(await DB.GetTableSize("Users", { Username, Password, }))["TableSize"];
        if (UserInfo === 0) return new Result(false, "Username or password incorrect");
        return new Result(true, "Username and password correct");
    }
    static GetUserPermission = async (DB: Database, Username: string): Promise<Result> => {
        let UserInfo = ThrowErrorIfFailed(await DB.Select("Users", ["Permission"], { Username, }))["Results"];
        if (UserInfo.length === 0) return new Result(false, "User does not exists");
        return new Result(true, "Got user permission", { Permission: UserInfo[0]["Permission"], });
    }
    static UpdateOnlineTime = async (DB: Database, Username: string): Promise<Result> => {
        return await DB.Update("Users", { "LastOnlineTime": new Date().getTime(), }, { Username });
    }
    static GetLuoguSettings = async (DB: Database, Username: string): Promise<Result> => {
        let UserInfo = ThrowErrorIfFailed(await DB.Select("Users", ["LuoguUsername", "LuoguPassword"], { Username, }))["Results"];
        if (UserInfo.length === 0) return new Result(false, "User does not exists");
        return new Result(true, "Got luogu settings", {
            LuoguUsername: UserInfo[0]["LuoguUsername"],
            LuoguPassword: UserInfo[0]["LuoguPassword"],
        });
    }
    static SetLuoguSettings = async (DB: Database, Username: string, LuoguUsername: string, LuoguPassword: string): Promise<Result> => {
        ThrowErrorIfFailed(await DB.Update("Users", { LuoguUsername, LuoguPassword, }, { Username, }))["Results"];
        return new Result(true, "Set luogu settings");
    }
    static GetUsers = async (DB: Database): Promise<Result> => {
        let UserInfo = ThrowErrorIfFailed(await DB.Select("Users", [], {}))["Results"];
        return new Result(true, "Got users", { UserInfo });
    }
    static AddUser = async (DB: Database, Username: string, Password: string): Promise<Result> => {
        ThrowErrorIfFailed(await DB.Insert("Users", { Username, Password, LastOnlineTime: new Date().getTime() }));
        return new Result(true, "User added");
    }
    static UpdateUser = async (DB: Database, Username: string, Password: string, LuoguUsername: string, LuoguPassword: string, Permission: string): Promise<Result> => {
        ThrowErrorIfFailed(await DB.Update("Users", { Password, LuoguUsername, LuoguPassword, Permission }, { Username }));
        return new Result(true, "User updated");
    }
}