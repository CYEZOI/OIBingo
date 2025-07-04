import { API } from "./API";
import { Database } from "./Database";
import { ThrowErrorIfFailed } from "./Result";
import { Utilities } from "./Utilities";

export class Process {
    private DB: Database;
    private RequestData: Request;

    constructor(DB: Database, RequestData: Request) {
        this.DB = DB;
        this.RequestData = RequestData;
    }

    public async Process(): Promise<Response> {
        let PathName = new URL(this.RequestData.url).pathname;
        PathName = PathName === "/" ? "/index.html" : PathName;
        PathName = PathName.substring(1);
        if (this.RequestData.method === "POST") {
            if (PathName != "API") {
                return new Response("Not found", {
                    status: 404
                });
            }
            if (this.RequestData.headers.get("content-type") !== "application/json") {
                return new Response("Request type is incorrect", {
                    status: 400
                });
            }
            let RequestJSON: object;
            try {
                RequestJSON = await this.RequestData.json();
            } catch (Error) {
                return new Response("Request data is incorrect", {
                    status: 400
                });
            }
            ThrowErrorIfFailed(Utilities.CheckParams(RequestJSON, {
                "APIName": "string",
                "APIParams": "object",
                "Auth": "object",
            }));
            let APIInstance = new API(this.DB, RequestJSON);
            let ResponseData = await APIInstance.Process();
            return new Response(JSON.stringify(ResponseData), {
                headers: {
                    "content-type": "application/json;charset=UTF-8"
                }
            });
        }
        return new Response("Request method is incorrect", {
            status: 400
        });
    }
}
