import express, { request } from 'express';
import { NextFunction, Request, Response } from 'express';
import endpoints from '../data/endpoints.json';
import {
    EndpointConfig, CdrConfig, cdrHeaderValidator, DefaultBankingEndpoints,
    DefaultEnergyEndpoints,
    cdrJwtScopes,
    DsbAuthConfig,
    cdrTokenValidator
} from '@cds-au/holder-sdk'
import { MongoData } from './services/database.service';
import { IDatabase } from './services/database.interface';
import bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import { SingleData } from './services/single.service';
import cors from 'cors';
import path from 'path';
import { readFileSync } from 'fs';
import * as https from 'https'

import { Issuer } from 'openid-client';
import { AuthService } from './services/auth-service';
import { cdrAuthorization } from './modules/auth';

dotenv.config();
console.log(JSON.stringify(process.env, null, 2));

const exp = express;
const app = express();

const port = `${process.env.APP_LISTENTING_PORT}`;
const authServerUrl = 'https://localhost:8081';
let standardsVersion = '/cds-au/v1';


// This implementation uses a MongoDB. To use some other persistent storage
// you need to implement the IDatabase interface
const connString = `mongodb://${process.env.MONGO_HOSTNAME}:${process.env.MONGO_PORT}`
const corsAllowedOrigin = process.env.CORS_ALLOWED_ORIGINS?.split(",")

const isSingleStr = process.env.DATA_IS_SINGLE_DOCUMENT;
var isSingle = isSingleStr?.toLowerCase() == 'true' ? true : false;
var isSingle = isSingleStr?.toLowerCase() == 'false' ? false : true;

console.log(`Connection string is ${connString}`);

var dbService: IDatabase;
if (isSingle == true)
    dbService = new SingleData(connString, process.env.MONGO_DB as string);
else
    dbService = new MongoData(connString, process.env.MONGO_DB as string);

let authService = new AuthService(dbService);

// Add a list of allowed origins.
// If you have more origins you would like to add, you can add them to the array below.
//const allowedOrigins = corsAllowedOrigin;
const corsOptions: cors.CorsOptions = {
    origin: corsAllowedOrigin
};
app.use(cors(corsOptions));

const router = exp.Router();
const sampleEndpoints = [...endpoints] as EndpointConfig[];
const dsbOptions: CdrConfig = {
    endpoints: sampleEndpoints
}
const certFile = path.join(__dirname, '/certificates/mtls-server.pem')
const keyFile = path.join(__dirname, '/certificates/mtls-server.key')
const rCert = readFileSync(certFile, 'utf8');
const rKey = readFileSync(keyFile, 'utf8');
const otions = {
    key: rKey,
    cert: rCert
}

let authOption: DsbAuthConfig = {
    scopeFormat: 'LIST',
    endpoints: sampleEndpoints
}
let tokenValidatorOptions: CdrConfig = {
    endpoints: sampleEndpoints
}

// function used to determine if the middleware is to be bypassed for the given 'paths'
function unless(middleware:any, ...paths: any) {
    return function(req: Request, res: Response, next: NextFunction) {
      const pathCheck = paths.some((path:string) => path === req.path);
      pathCheck ? next() : middleware(req, res, next);
    };
  };
  
app.use(unless(cdrJwtScopes(authOption), "/login-data/energy", "/jwks"));
app.use(unless(cdrTokenValidator(tokenValidatorOptions), "/login-data/energy", "/jwks"));
app.use(unless(cdrHeaderValidator(dsbOptions), "/login-data/energy", "/jwks"));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/', router);

dbService.connectDatabase()
    .then(() => {
        initAuthService();     
    })
    .catch((error: Error) => {
        console.error("Database connection failed", error);
        process.exit();
    })

async function initAuthService() {
    const certFile = path.join(__dirname, '/certificates/mtls-server.pem')
    const keyFile = path.join(__dirname, '/certificates/mtls-server.key')
    const rCert = readFileSync(certFile, 'utf8');
    const rKey = readFileSync(keyFile, 'utf8');
    const otions = {
        key: rKey,
        cert: rCert
    }
    let discovery = await Issuer.discover(authServerUrl);
    //console.log('Discovered issuer %s %O',  discovery.metadata);
    let init = await authService.initAuthService(discovery.metadata);
    if (init == false) {
        console.log('WARNING: Authentication service could not be initalised');
    }
    https.createServer(otions, app)
    .listen(port, () => {
        console.log('Server started');
    })
}

// anything /energy/accounts/<something-else> needs  to be routed like this 
router.get(`${standardsVersion}/energy/accounts/:accountId`, async (req, res) => {
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }
    if (accountIsValid(req.params?.accountId) == false){
        res.status(404).json('Not Found');
        return;      
    }
    console.log(`Received request on ${port} for ${req.url}`);
    var excludes = ["invoices", "billing", "balances"];
    if (excludes.indexOf(req.params?.accountId) == -1) {
        let result = await dbService.getEnergyAccountDetails(userId, req.params?.accountId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    }
    if (req.params?.accountId == "invoices") {
        let result = await dbService.getBulkInvoicesForUser(userId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            res.send(result);
        }
    }

    if (req.params?.accountId == "billing") {
        let result = await dbService.getBulkBilllingForUser(userId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            res.send(result);
        }
    }

    if (req.params?.accountId == "balances") {
        let result = await dbService.getBulkBalancesForUser(userId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            res.send(result);
        }
    }
})

// anything /energy/electricity/servicepoints/<something-else> needs  to be routed like this 
router.get(`${standardsVersion}/energy/electricity/servicepoints/:servicePointId`, async (req, res) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }
    var excludes = ["usage", "der"];
    if (excludes.indexOf(req.params?.servicePointId) == -1) {
        let result = await dbService.getServicePointDetails(userId, req.params?.servicePointId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    }
    if (req.params?.servicePointId == "usage") {
        console.log(`Received request on ${port} for ${req.url}`);
        let result = await dbService.getBulkUsageForUser(userId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    }

    if (req.params?.servicePointId == "der") {
        let result = await dbService.getBulkDerForUser(userId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            res.send(result);
        }
    }
})

// this endpoint requires authentication
app.get(`${standardsVersion}/energy/accounts`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }
    let ret = await dbService.getEnergyAccounts(userId, authService.authUser?.accounts as string[]);
    ret.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
    res.send(ret);
});

// tget list of service points, returns EnergyServicePointListResponse
app.get(`${standardsVersion}/energy/electricity/servicepoints`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }
    let result = await dbService.getServicePoints(userId);
    //let result: any = null;
    if (result == null) {
        res.sendStatus(404);
        return;
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

app.get(`${standardsVersion}/common/customer/detail`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }
    let result = await dbService.getCustomerDetails(userId);
    if (result == null) {
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

app.get(`${standardsVersion}/common/customer`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }
    let result = await dbService.getCustomerDetails(userId);
    if (result == null) {
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

app.get(`${standardsVersion}/energy/plans/:planId`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let result = await dbService.getEnergyPlanDetails(req.params.planId)
    if (result == null) {
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// this endpoint does NOT require authentication
app.get(`${standardsVersion}/energy/plans/`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let result = await dbService.getEnergyAllPlans()
    if (result == null) {
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// get usage fort a service point, returns EnergyUsageListResponse
app.get(`${standardsVersion}/energy/electricity/servicepoints/:servicePointId/usage`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }
    let result = await dbService.getUsageForServicePoint(userId, req.params.servicePointId)
    if (result == null) {
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }

});

// get der for a service point, returns EnergyDerDetailResponse
app.get(`${standardsVersion}/energy/electricity/servicepoints/:servicePointId/der`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }
    let result = await dbService.getDerForServicePoint(userId, req.params.servicePointId);
    if (result == null) {
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }

});

// get der for a service point, returns EnergyDerDetailResponse
app.post(`${standardsVersion}/energy/electricity/servicepoints/der`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }
    let result = await dbService.getDerForMultipleServicePoints(userId, req.body?.accountIds)
    if (result == null) {
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// get account details for an accountID, returns EnergyAccountDetailResponseV2
app.get(`${standardsVersion}/energy/accounts/:accountId`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }
    if (accountIsValid(req.params?.accountId) == false){
        res.status(401).json('Not authorized');
        return;      
    }
    var excludes = ["invoices"];
    if (excludes.indexOf(req.params?.accountId) == -1) {
        let result = await dbService.getEnergyAccountDetails(userId, req.params?.accountId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    }
    else {
        app.get(`${standardsVersion}/energy/accounts/`);
    }

});

// get account details for an accountID, returns EnergyAccountDetailResponseV2
app.get(`${standardsVersion}/energy/accounts/:accountId/invoices`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }
    if (accountIsValid(req.params?.accountId) == false){
        res.status(401).json('Not authorized');
        return;      
    }
    let result = await dbService.getInvoicesForAccount(userId, req.params?.accountId)
    if (result == null) {
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// get invoices for account, returns EnergyInvoiceListResponse
app.get(`${standardsVersion}/energy/accounts/:accountId/invoices`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }
    if (accountIsValid(req.params?.accountId) == false){
        res.status(401).json('Not authorized');
        return;      
    }
    let result = await dbService.getInvoicesForAccount(userId, req.params.accountId)
    if (result == null) {
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// get invoices for account, returns EnergyInvoiceListResponse
app.post(`${standardsVersion}/energy/accounts/invoices`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received POST request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }
    let result = await dbService.getInvoicesForMultipleAccounts(userId, req.body?.data?.accountIds)
    if (result == null) {
        res.sendStatus(404);
    } else {
        res.send(result);
    }
});

// get invoices for account, returns EnergyInvoiceListResponse
app.get(`${standardsVersion}/energy/accounts/invoices`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received GET request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }

    let result = await dbService.getBulkInvoicesForUser(userId)
    if (result == null) {
        res.sendStatus(404);
    } else {
        res.send(result);
    }
});

// get invoices for account, returns EnergyInvoiceListResponse
app.post(`${standardsVersion}/energy/electricity/servicepoints/usage`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }

    let result = await dbService.getUsageForMultipleServicePoints(userId, req.body?.data?.servicePointIds)
    if (result == null) {
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// get concessions for account, returns EnergyConcessionsResponse
app.get(`${standardsVersion}/energy/accounts/:accountId/concessions`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }
    if (accountIsValid(req.params?.accountId) == false){
        res.status(401).json('Not authorized');
        return;      
    }
    let result = await dbService.getConcessionsForAccount(userId, req.params?.accountId)
    if (result == null) {
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// get balance for account, returns EnergyBalanceResponse
app.get(`${standardsVersion}/energy/accounts/:accountId/balance`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }
    if (accountIsValid(req.params?.accountId) == false){
        res.status(401).json('Not authorized');
        return;      
    }
    let st = `Received request on ${port} for ${req.url}`;
    let result = await dbService.getBalanceForAccount(userId, req.params?.accountId)
    if (result == null) {
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// get payment schedule for account, returns EnergyPaymentScheduleResponse
app.get(`${standardsVersion}/energy/accounts/:accountId/payment-schedule`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }
    if (accountIsValid(req.params?.accountId) == false){
        res.status(401).json('Not authorized');
        return;      
    }
    let result = await dbService.getPaymentSchedulesForAccount(userId, req.params?.accountId)
    if (result == null) {
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// get payment schedule for account, returns EnergyPaymentScheduleResponse
app.get(`${standardsVersion}/energy/accounts/:accountId/billing`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }
    if (accountIsValid(req.params?.accountId) == false){
        res.status(401).json('Not authorized');
        return;      
    }
    let result = await dbService.getTransactionsForAccount(userId, req.params?.accountId)
    if (result == null) {
        res.sendStatus(404);
    } else {
        res.send(result);
    }
});

// get billing for a number of accounts
app.post(`${standardsVersion}/energy/accounts/billing`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }

    let result = await dbService.getBillingForMultipleAccounts(userId, req.body?.data?.accountIds)
    if (result == null) {
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// get billing for a number of accounts
app.get(`/jwks`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let result = 'Ades123'
    res.send(result);
});

app.get(`${standardsVersion}/energy/accounts/:accountId/payment-schedule`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let temp = req.headers?.authorization as string;
    let tokenIsValid = await authService.verifyAccessToken(temp) 
    if (tokenIsValid == false) {
        res.status(401).json('Not authorized');
        return;
    }
    let userId = getUserId(req);
    if (userId == undefined) {
        res.status(401).json('Not authorized');
        return;
    }
    if (accountIsValid(req.params?.accountId) == false){
        res.status(401).json('Not authorized');
        return;      
    }
    let result = await dbService.getPaymentSchedulesForAccount(userId, req.params?.accountId)
    if (result == null) {
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// Get the information required by the Auth server to displaythe login screen
app.get(`/login-data/:sector`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    if (sectorIsValid(req.params?.sector) == false){
        res.status(404).json('Not Found');
        return;      
    }
    if (loginIsValid(req.params?.login) == false){
        res.status(404).json('Not Found');
        return;      
    }
    let customers = await dbService.getLoginInformation(req.params?.login, req.params?.sector)
    let result = { Customers: customers};
    res.send(result);
});

// In the absence of an IdP we use the accessToken as userId
function getUserId(req: any): string | undefined {
    return authService.authUser?.customerId;
}

function accountIsValid(accountId: string): boolean{
    let idx = authService?.authUser?.accounts?.findIndex(x => x == accountId)
    return (idx != undefined && idx > -1);
}

function sectorIsValid(sector: string) : boolean {
    let validSectors = ['energy', 'banking']
    let st = sector.toLowerCase();
    return validSectors.indexOf(st)>-1
}

function loginIsValid(login: string): boolean {
    return true;
}

