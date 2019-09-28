import { NextFunction, Response } from "express";
import { ServiceArg } from "../../service";
import { Util } from "../../util";
import { BadRequestResponse, ErrorResponse, IAPIRequest, NotFoundResponse, ServiceResponse } from "../response";

let logger = null;

export const createAPIHandler = (handler: IServiceHandler, config?: { options?: IServiceRouteOptions }): IServiceHandler =>
  async (req: IAPIRequest, res: Response, next: NextFunction) => {
    try {
      logger = logger ? logger : Util.getLogger("APIHandler");
      if (config && config.options && config.options.allowedMethods && config.options.allowedMethods.indexOf(req.method.toUpperCase()) === -1) {
        new NotFoundResponse().send(res);
      } else {
        if (req.session === undefined) {
          req.session = null;
        }
        await handler(req, res, next);
      }
    } catch (e) {
      if (e.isMethodNotImplementedError) {
        new NotFoundResponse().send(res);
      } else if (e.isParserOptionsError) {
        new BadRequestResponse(e.message).send(res);
      } else if (e.name === "SequelizeValidationError") {
        new BadRequestResponse(e.message).send(res);
      } else if (e.name === "SequelizeEagerLoadingError") {
        new BadRequestResponse(e.message).send(res);
      } else if (e.name === "SequelizeUniqueConstraintError") {
        new BadRequestResponse(e.message).send(res);
      } else {
        logger.error(e);
        new ErrorResponse(e.message).send(res);
      }
    }
  };

export interface IServiceHandler {
  // tslint:disable-next-line callable-types (This is extended from and can't extend from a type alias in ts<2.2
  (req: IAPIRequest, res: Response, next?: NextFunction): Promise<any>;
}

export interface IServiceRouteOptions {
  allowedMethods?: string[];
  preRoute?: string;
  postRoute?: string;
}

export type IRouteOptions = IServiceRouteOptions;

export const createServiceHandler = (service, method: string, options?: { options?: IServiceRouteOptions }): IServiceHandler =>
  async (req: IAPIRequest, res: Response) => {
    await new ServiceResponse(
      await service[method](
        new ServiceArg(req)
      )
    ).send(res);
  };

export const createServiceAPIHandler = (service, method: string, options?: { options?: IServiceRouteOptions }): IServiceHandler =>
  createAPIHandler(
    async (req: IAPIRequest, res: Response) => {
      await new ServiceResponse(
        await service[method](
          new ServiceArg(req)
        )
      ).send(res);
    }, options);
