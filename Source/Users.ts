import { Database } from "./Database";
import { Luogu } from "./Luogu";
import { Result, ThrowErrorIfFailed } from "./Result";

export class Users {
    static CheckUsernameAndPassword = async (DB: Database, Username: string, Password: string): Promise<Result> => {
        let UserInfo = ThrowErrorIfFailed(await DB.GetTableSize("Users", { Username, Password, }))["TableSize"];
        if (UserInfo === 0) return new Result(false, "Username or password incorrect");
        return new Result(true, "Username and password correct");
    }
    static UpdateOnlineTime = async (DB: Database, Username: string): Promise<Result> => {
        return await DB.Update("Users", { "LastOnlineTime": new Date().getTime(), }, { Username });
    }
    static GetUser = async (DB: Database, Username: string): Promise<Result> => {
        let UserInfo = ThrowErrorIfFailed(await DB.Select("Users", [], { Username, }))["Results"];
        if (UserInfo.length === 0) return new Result(false, "User does not exists");
        return new Result(true, "Got user", UserInfo[0]);
    }
    static SetSettings = async (DB: Database, Username: string, LuoguUsername: string, LuoguPassword: string, Color: string, Avatar: string): Promise<Result> => {
        ThrowErrorIfFailed(await DB.Update("Users", { LuoguUsername, LuoguPassword, Color, Avatar, }, { Username, }))["Results"];
        return new Result(true, "Set settings");
    }
    static GetUsers = async (DB: Database): Promise<Result> => {
        let UserInfo = ThrowErrorIfFailed(await DB.Select("Users", [], {}))["Results"];
        return new Result(true, "Got users", { UserInfo });
    }
    static AddUser = async (DB: Database, Username: string, Password: string): Promise<Result> => {
        ThrowErrorIfFailed(await DB.Insert("Users", { Username, Password, LastOnlineTime: new Date().getTime() }));
        ThrowErrorIfFailed(await Luogu.GenerateNewCookies(DB, Username));
        return new Result(true, "User added");
    }
    static UpdatePermission = async (DB: Database, Username: string, Permission: string): Promise<Result> => {
        ThrowErrorIfFailed(await DB.Update("Users", { Permission }, { Username }));
        return new Result(true, "User updated");
    }
}