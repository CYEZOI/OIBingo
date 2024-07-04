import { Database } from "./Database";
import { DatabaseColumn } from "./DatabaseColumn";
import { Output } from "./Output";
import { ThrowErrorIfFailed } from "./Result";

export class Initial {
    private DB: Database;
    private TableList = {
        Users: [
            new DatabaseColumn({ "Name": "Username", "Type": "TEXT", "NotNull": true, "PrimaryKey": true }),
            new DatabaseColumn({ "Name": "Password", "Type": "TEXT", "NotNull": true }),
            new DatabaseColumn({ "Name": "LuoguUsername", "Type": "TEXT" }),
            new DatabaseColumn({ "Name": "LuoguPassword", "Type": "TEXT" }),
            new DatabaseColumn({ "Name": "LuoguClientID", "Type": "TEXT" }),
            new DatabaseColumn({ "Name": "LastLoginTime", "Type": "DATETIME", "NotNull": true, "DefaultValue": "CURRENT_TIMESTAMP" }),
            new DatabaseColumn({ "Name": "Permission", "Type": "INTEGER", "NotNull": true, "DefaultValue": "0" }),
        ],
        Tokens: [
            new DatabaseColumn({ "Name": "TokenValue", "Type": "TEXT", "NotNull": true, "PrimaryKey": true }),
            new DatabaseColumn({ "Name": "Username", "Type": "TEXT", "NotNull": true }),
            new DatabaseColumn({ "Name": "CreateTime", "Type": "DATETIME", "NotNull": true, "DefaultValue": "CURRENT_TIMESTAMP" }),
        ],
    }
    constructor(DB: Database) {
        this.DB = DB;
    }
    public async Init() {
        for (let i in this.TableList) {
            let IsSame: boolean = true;
            if (!ThrowErrorIfFailed(await this.DB.IfTableExists(i))["TableExists"]) {
                IsSame = false;
            }
            else {
                let TableStructure: Array<DatabaseColumn> = ThrowErrorIfFailed(await this.DB.GetTableStructure(i))["TableStructure"];
                if (TableStructure.length != this.TableList[i].length) {
                    IsSame = false;
                }
                else {
                    for (let j in TableStructure) {
                        if (TableStructure[j].ToString() != this.TableList[i][j].ToString()) {
                            Output.Warn(TableStructure[j].ToString() + " != " + this.TableList[i][j].ToString());
                            IsSame = false;
                            break;
                        }
                    }
                }
                if (!IsSame) {
                    ThrowErrorIfFailed(await this.DB.DropTable(i));
                }
            }
            if (!IsSame) {
                ThrowErrorIfFailed(await this.DB.CreateTable(i, this.TableList[i]));
                Output.Warn("Table \"" + i + "\" created");
            }
        }
    }
};