import { IAPIRequest } from "../../route";
import { ISimpleMap } from "../../util";

export interface INoTokenSession {
  account: string;
  username: string;
  groups: string[];
}

export interface ISession extends INoTokenSession {
  token: string;
}

export interface IServiceArgs extends ISimpleMap<any> {
  session: ISession;
  params: ISimpleMap<any>;
  query: ISimpleMap<any>;
  body: ISimpleMap<any>;
  headers: ISimpleMap<any>;
}

export class ServiceArg implements IServiceArgs {
  public session: ISession;
  public params: ISimpleMap<any>;
  public query: ISimpleMap<any>;
  public body: ISimpleMap<any>;
  public headers: ISimpleMap<any>;
  public constructor(req: IAPIRequest) {
    this.session = req.session;
    this.params = req.params;
    this.query = req.query;
    this.body = req.body;
    this.headers = req.headers;
  }
}
