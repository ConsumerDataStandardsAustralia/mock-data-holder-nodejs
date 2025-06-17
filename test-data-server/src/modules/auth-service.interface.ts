import { Introspection } from "../models/introspection";
import { DsbCdrUser } from "../models/user";
import { NextFunction, Request, Response } from 'express';

export interface IAuthService {
    //authUser: DsbCdrUser| undefined;
    initAuthService(): Promise<boolean>;
    verifyAccessToken(token?: string): Promise<Introspection|null>;
    getUser(req: Request): DsbCdrUser|undefined;
    setUser(req: Request, accessTokenObject: Introspection | undefined): Promise<DsbCdrUser|undefined>;
}