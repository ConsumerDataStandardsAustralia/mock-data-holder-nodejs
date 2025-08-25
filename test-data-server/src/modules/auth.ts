
import { Request, Response } from 'express';
import { NextFunction } from 'express';
import { CdrConfig, DefaultBankingEndpoints, DefaultCommonEndpoints, DefaultEnergyEndpoints, EndpointConfig } from "@cds-au/holder-sdk";
import energyEndpoints  from '../../src/data/cdr-energy-endpoints.json';
import bankingEndpoints from '../../src/data/cdr-banking-endpoints.json';
import commonEndpoints from '../../src/data/cdr-common-endpoints.json';
import { DsbEndpoint } from "../models/dsb-endpoints";
import { IAuthService } from "./auth-service.interface";
import { CdrArrangement } from './cdr-arrangement.model';
import { Introspection } from '../models/introspection';


const defaultEndpoints = [...energyEndpoints, ...bankingEndpoints, ...commonEndpoints];


// TODO need to be incorporated in holder-sdk middleware
export function cdrAuthorization(authService: IAuthService,  options: CdrConfig | undefined): any {
    
    return async function authorize(req: Request, res: Response, next: NextFunction) {

        // get the endpoint
        let ep = getEndpoint(req as Request, options);
        if (ep?.authScopesRequired == null){
            next();
            return;
        }

        let accessToken = req.headers?.authorization;

        
        // In NO_AUTH_SERVER=false an accessToken may still be provided
        if (accessToken == null) {
            res.status(404).json('No authorization header provided');
            return;
        }
        
        // validate access token via introspective endpoint
        req.clientId = process.env.CLIENT_ID;
        const accessTokenObject: Introspection | null = await authService.verifyAccessToken(accessToken)
        if (accessTokenObject == null) {
            res.status(401).json('Invalid access token');
            return;
        } 

       
        if (accessTokenObject.exp == null || accessTokenObject.exp < Date.now()/1000) {
            res.status(401).json('Access token has expired');
            return;     
        }
        
        if (authService.getUser(req) == null)
             // by passing in the decoded accessTokenObject this eliminates the call which was already done with verifyAccessToken
            await authService.setUser(req, accessTokenObject)
              
        next();
    };

    function removeEmptyEntries(arr: string[]): string[] {
        let returnArray: string[] = [];
        arr.forEach(elem => {
            if (elem != null && elem.trim() != '') {
                returnArray.push(elem);
            }
        });
        return returnArray;
    }

    function removeBasePath(basePath: string | undefined, pathArray: string[]): string[] {
        // If no base path then do nothing
        if (!basePath) return pathArray;

        const baseArray = basePath.split('/').splice(1);

        // If the base path is longer then the path then do nothing as there cannot be a match 
        if (baseArray.length > pathArray.length) return pathArray;

        // See if the base path matches the start of the path by comparing each component
        const varRegex = /^[{].*[}]$/;
        for (let i = 0; i < baseArray.length; i++) {
            if (baseArray[i].match(varRegex) || baseArray[i] === pathArray[i]) continue;

            // A mismatch is found so return
            return pathArray;
        }

        return pathArray.slice(baseArray.length);
    }
    // This will get the full endpoint information based on the rquest url
    // The DsbEndpoint class contains information re requirements for x-fapi-interaction-id, 
    // x-cds-arrangment-id and other things
    function getEndpoint(req: Request, options: CdrConfig | undefined): DsbEndpoint | null {
        var  endpoints = defaultEndpoints as DsbEndpoint[];
        let requestUrlElements: string[] = req.url.split('?');
        // create an array with all the path elements
        let requestUrlArray = requestUrlElements[0].split('/').splice(1);
        requestUrlArray = removeEmptyEntries(requestUrlArray);
        // remove the base path if one has been specified in config
        requestUrlArray = removeBasePath(options?.basePath, requestUrlArray);

        // ensure that the cds-au/v1 exists
        if (requestUrlArray.length < 3) {
            // this cannot be a CDR endpoint
            return null;
        }
        if (requestUrlArray[0] != 'cds-au' || requestUrlArray[1] != 'v1') {
            // this cannot be a CDR endpoint
            return null;
        }
        requestUrlArray = requestUrlArray.slice(2);
        requestUrlArray = removeEmptyEntries(requestUrlArray);

        // this array should have at least 2 entries. There is no CDR endpoint with less than that
        if (requestUrlArray.length < 2) return null;
        // get a subset of endpoints this url could be, filter by the first two parts of url and request type
        let urlSubSet = endpoints.filter(x => x.requestPath.toLowerCase().startsWith(`/${requestUrlArray[0]}/${requestUrlArray[1]}`) && x.requestType == req.method);
        let returnEP = null;

        urlSubSet.forEach(u => {
            let elements: string[] = u.requestPath.split('/');
            elements = removeEmptyEntries(elements);
            // if the passed in url has the same number of elements as the CDR endpoint
            // this could be a match
            let isMatch: boolean = true;
            if (elements.length == requestUrlArray.length) {
                for (let i = 0; i < elements.length; i++) {
                    if (elements[i].startsWith('{') && elements[i].endsWith('}')) {
                        continue;
                    }
                    if (elements[i].toLowerCase() != requestUrlArray[i].toLowerCase()) {
                        isMatch = false;
                        break;
                    }
                }
                isMatch ? returnEP = u : null;
            }
        })
        return returnEP;
    }

};
