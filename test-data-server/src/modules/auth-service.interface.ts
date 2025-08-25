import { Introspection } from "../models/introspection";
import { DsbCdrUser } from "../models/user";
import { NextFunction, Request, Response } from 'express';

/* This is the interface responsible for communication with the IdP. Currently this can be Panva, Standalone (ie no auth), or
   the ACCC implementation */
   
export interface IAuthService {
    defaultAccessToken: string | undefined /* When provided, this is used when to token is found in the request header (but is required).
            Primarily here for the "no-auth" use case. This must be a JWT encoded token */
    clientId: string; /* this is the clientId for the resource server itself. Required for some calls to the Idp */
    clientSecret: string; /* this is the clientSecret for the resource server itself. Required for some calls to the Idp */
    initAuthService(): Promise<boolean>; /* Initialises the authorisation service based on discovery endpoint */
    verifyAccessToken(token?: string): Promise<Introspection|null>; /* This will typically be called by the middleware to validate the token */
    getUser(req: Request): DsbCdrUser|undefined;
    setUser(req: Request, introspectionObject: Introspection | undefined): Promise<DsbCdrUser|undefined>;
}