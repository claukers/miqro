import * as express from "express";
import { ISession } from "../../service";
import { ISimpleMap } from "../../util";

export interface IAPIRequest extends express.Request {
  session: ISession;
  params: ISimpleMap<any>;
}

export class APIResponse {
  public status = 200;
  constructor(private body?: any) { }
  public async send(res: express.Response) {
    res.status(this.status);
    res.json(this.body);
  }
}
