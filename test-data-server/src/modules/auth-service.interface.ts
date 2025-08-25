import { Introspection } from "../models/introspection";
import { DsbCdrUser } from "../models/user";
import { NextFunction, Request, Response } from 'express';

/* This is the interface responsible for communication with the IdP. Currently this can be Panva, Standalone (ie no auth), or
   the ACCC implementation */
   
export interface IAuthService {
    initAuthService(): Promise<boolean>; /* Initialises the authorisation service based on discovery endpoint */
    verifyAccessToken(token?: string): Promise<Introspection|null>; /* This will typically be called by the middleware to validate the token */
    getUser(req: Request): DsbCdrUser|undefined;
    setUser(req: Request, accessTokenObject: Introspection | undefined): Promise<DsbCdrUser|undefined>;
}