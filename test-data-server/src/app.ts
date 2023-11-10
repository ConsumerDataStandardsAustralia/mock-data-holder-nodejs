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
import { EnergyDataMongo } from './services/database-energy.service';
import { IEnergyData } from './services/database-energy.interface';
import bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import { EnergyDataSingle } from './services/single-energy.service';
import cors from 'cors';
import path from 'path';
import { readFileSync } from 'fs';
import * as https from 'https'

import { Issuer } from 'openid-client';
import { AuthService } from './services/auth-service';
import { cdrAuthorization } from './modules/auth';
import { IBankingData } from './services/database-banking.interface';
import { BankingDataSingle } from './services/single-banking.service';
import { AuthDataService } from './services/database-auth.service';
import { BankingDataMongo } from './services/database-banking.service';
import { IAuthData } from './services/database-auth.interface';

dotenv.config();
console.log(JSON.stringify(process.env, null, 2));

const exp = express;
const app = express();

const port = `${process.env.APP_LISTENTING_PORT}`;
const authServerUrl = `${process.env.AUTH_SERVER_URL}`;
let standardsVersion = '/cds-au/v1';


// This implementation uses a MongoDB. To use some other persistent storage
// you need to implement the IDatabase interface
const connString = `mongodb://${process.env.MONGO_HOSTNAME}:${process.env.MONGO_PORT}`
const corsAllowedOrigin = process.env.CORS_ALLOWED_ORIGINS?.split(",")

const isSingleStr = process.env.DATA_IS_SINGLE_DOCUMENT;
var isDataSingleDocument = isSingleStr?.toLowerCase() == 'true' ? true : false;
var isDataSingleDocument = isSingleStr?.toLowerCase() == 'false' ? false : true;
console.log(`Connection string is ${connString}`);

var dbEnergyDataService: IEnergyData;
var dbBankingDataService: IBankingData;
var dbAuthDataService: IAuthData;
if (isDataSingleDocument == true) {
    dbEnergyDataService = new EnergyDataSingle(connString, process.env.MONGO_DB as string);
    dbBankingDataService = new BankingDataSingle(connString, process.env.MONGO_DB as string);
    dbAuthDataService = new AuthDataService(connString, process.env.MONGO_DB as string)
}

else {
    dbEnergyDataService = new EnergyDataMongo(connString, process.env.MONGO_DB as string);
    dbBankingDataService = new BankingDataMongo(connString, process.env.MONGO_DB as string);
    dbAuthDataService = new AuthDataService(connString, process.env.MONGO_DB as string)
}


let authService = new AuthService(dbAuthDataService);


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
const certFile = path.join(__dirname, '/security/mock-data-holder/tls', process.env.CERT_FILE as string)
const keyFile = path.join(__dirname, '/security/mock-data-holder/tls', process.env.CERT_KEY_FILE as string)
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
function unless(middleware: any, ...paths: any) {
    return function (req: Request, res: Response, next: NextFunction) {
        const pathCheck = paths.some((path: string) => path === req.path);
        pathCheck ? next() : middleware(req, res, next);
    };
};

app.use(unless(cdrJwtScopes(authOption), "/login-data/energy", "/jwks"));
app.use(unless(cdrTokenValidator(tokenValidatorOptions), "/login-data/energy", "/jwks"));
app.use(unless(cdrHeaderValidator(dsbOptions), "/login-data/energy", "/jwks"));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/', router);

dbEnergyDataService.connectDatabase()
    .then(() => {
        initAuthService();
    })
    .catch((error: Error) => {
        console.error("Database connection failed", error);
        process.exit();
    })

async function initAuthService() {
    const otions = {
        key: rKey,
        cert: rCert
    }
    console.log(`Interrogating discovery endpoint : ${authServerUrl}`);
    let init = await authService.initAuthService();
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

    try {
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

        console.log(`Received request on ${port} for ${req.url}`);
        var excludes = ["invoices", "billing", "balances"];
        if (excludes.indexOf(req.params?.accountId) == -1) {
            if (accountIsValid(req.params?.accountId) == false) {
                res.status(404).json('Not Found');
                return;
            }
            let result = await dbEnergyDataService.getEnergyAccountDetails(userId, req.params?.accountId)
            if (result == null) {
                res.sendStatus(404);
            } else {
                result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
                res.send(result);
            }
        }
        if (req.params?.accountId == "invoices") {
            let result = await dbEnergyDataService.getBulkInvoicesForUser(userId)
            if (result == null) {
                res.sendStatus(404);
            } else {
                res.send(result);
            }
        }

        if (req.params?.accountId == "billing") {
            let result = await dbEnergyDataService.getBulkBilllingForUser(userId)
            if (result == null) {
                res.sendStatus(404);
            } else {
                res.send(result);
            }
        }

        if (req.params?.accountId == "balances") {
            let result = await dbEnergyDataService.getBulkBalancesForUser(userId)
            if (result == null) {
                res.sendStatus(404);
            } else {
                res.send(result);
            }
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
})

// anything /energy/electricity/servicepoints/<something-else> needs  to be routed like this 
router.get(`${standardsVersion}/energy/electricity/servicepoints/:servicePointId`, async (req, res) => {
    try {
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
            let result = await dbEnergyDataService.getServicePointDetails(userId, req.params?.servicePointId)
            if (result == null) {
                res.sendStatus(404);
            } else {
                result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
                res.send(result);
            }
        }
        if (req.params?.servicePointId == "usage") {
            console.log(`Received request on ${port} for ${req.url}`);
            let result = await dbEnergyDataService.getBulkUsageForUser(userId)
            if (result == null) {
                res.sendStatus(404);
            } else {
                result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
                res.send(result);
            }
        }

        if (req.params?.servicePointId == "der") {
            let result = await dbEnergyDataService.getBulkDerForUser(userId)
            if (result == null) {
                res.sendStatus(404);
            } else {
                res.send(result);
            }
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
})

// this endpoint requires authentication
app.get(`${standardsVersion}/energy/accounts`, async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        let ret = await dbEnergyDataService.getEnergyAccounts(userId, authService.authUser?.accounts as string[]);
        ret.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(ret);
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
});

// tget list of service points, returns EnergyServicePointListResponse
app.get(`${standardsVersion}/energy/electricity/servicepoints`, async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        let result = await dbEnergyDataService.getServicePoints(userId);
        //let result: any = null;
        if (result == null) {
            res.sendStatus(404);
            return;
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
});

app.get(`${standardsVersion}/common/customer/detail`, async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        let result = await dbEnergyDataService.getCustomerDetails(userId);
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
});

app.get(`${standardsVersion}/common/customer`, async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        let result = await dbEnergyDataService.getCustomerDetails(userId);
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
});

app.get(`${standardsVersion}/energy/plans/:planId`, async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log(`Received request on ${port} for ${req.url}`);
        let result = await dbEnergyDataService.getEnergyPlanDetails(req.params.planId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }

});

// this endpoint does NOT require authentication
app.get(`${standardsVersion}/energy/plans/`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    try {
        let result = await dbEnergyDataService.getEnergyAllPlans()
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }

});

// get usage fort a service point, returns EnergyUsageListResponse
app.get(`${standardsVersion}/energy/electricity/servicepoints/:servicePointId/usage`, async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        let result = await dbEnergyDataService.getUsageForServicePoint(userId, req.params.servicePointId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
});

// get der for a service point, returns EnergyDerDetailResponse
app.get(`${standardsVersion}/energy/electricity/servicepoints/:servicePointId/der`, async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        let result = await dbEnergyDataService.getDerForServicePoint(userId, req.params.servicePointId);
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
});

// get der for a service point, returns EnergyDerDetailResponse
app.post(`${standardsVersion}/energy/electricity/servicepoints/der`, async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        let result = await dbEnergyDataService.getDerForMultipleServicePoints(userId, req.body?.accountIds)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
});

// get account details for an accountID, returns EnergyAccountDetailResponseV2
app.get(`${standardsVersion}/energy/accounts/:accountId`, async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        if (accountIsValid(req.params?.accountId) == false) {
            res.status(401).json('Not authorized');
            return;
        }
        var excludes = ["invoices"];
        if (excludes.indexOf(req.params?.accountId) == -1) {
            let result = await dbEnergyDataService.getEnergyAccountDetails(userId, req.params?.accountId)
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
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
});

// get account details for an accountID, returns EnergyAccountDetailResponseV2
app.get(`${standardsVersion}/energy/accounts/:accountId/invoices`, async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        if (accountIsValid(req.params?.accountId) == false) {
            res.status(401).json('Not authorized');
            return;
        }
        let result = await dbEnergyDataService.getInvoicesForAccount(userId, req.params?.accountId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
});

// get invoices for account, returns EnergyInvoiceListResponse
app.get(`${standardsVersion}/energy/accounts/:accountId/invoices`, async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        if (accountIsValid(req.params?.accountId) == false) {
            res.status(401).json('Not authorized');
            return;
        }
        let result = await dbEnergyDataService.getInvoicesForAccount(userId, req.params.accountId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
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
    let result = await dbEnergyDataService.getInvoicesForMultipleAccounts(userId, req.body?.data?.accountIds)
    if (result == null) {
        res.sendStatus(404);
    } else {
        res.send(result);
    }
});


// get invoices for account, returns EnergyInvoiceListResponse
app.post(`${standardsVersion}/energy/accounts/balances`, async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        let result = await dbEnergyDataService.getBalancesForMultipleAccount(userId, req.body?.data?.accountIds)
        if (result == null) {
            res.sendStatus(404);
        } else {
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
});

// get invoices for account, returns EnergyInvoiceListResponse
app.get(`${standardsVersion}/energy/accounts/invoices`, async (req: Request, res: Response, next: NextFunction) => {
    try {
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

        let result = await dbEnergyDataService.getBulkInvoicesForUser(userId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
});

// get invoices for account, returns EnergyInvoiceListResponse
app.post(`${standardsVersion}/energy/electricity/servicepoints/usage`, async (req: Request, res: Response, next: NextFunction) => {
    try {
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

        let result = await dbEnergyDataService.getUsageForMultipleServicePoints(userId, req.body?.data?.servicePointIds)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
});

// get concessions for account, returns EnergyConcessionsResponse
app.get(`${standardsVersion}/energy/accounts/:accountId/concessions`, async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        if (accountIsValid(req.params?.accountId) == false) {
            res.status(401).json('Not authorized');
            return;
        }
        let result = await dbEnergyDataService.getConcessionsForAccount(userId, req.params?.accountId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
});

// get balance for account, returns EnergyBalanceResponse
app.get(`${standardsVersion}/energy/accounts/:accountId/balance`, async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        if (accountIsValid(req.params?.accountId) == false) {
            res.status(401).json('Not authorized');
            return;
        }
        let st = `Received request on ${port} for ${req.url}`;
        let result = await dbEnergyDataService.getBalanceForAccount(userId, req.params?.accountId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
});

// get payment schedule for account, returns EnergyPaymentScheduleResponse
app.get(`${standardsVersion}/energy/accounts/:accountId/payment-schedule`, async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        if (accountIsValid(req.params?.accountId) == false) {
            res.status(401).json('Not authorized');
            return;
        }
        let result = await dbEnergyDataService.getPaymentSchedulesForAccount(userId, req.params?.accountId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
});

// get payment schedule for account, returns EnergyPaymentScheduleResponse
app.get(`${standardsVersion}/energy/accounts/:accountId/billing`, async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        if (accountIsValid(req.params?.accountId) == false) {
            res.status(401).json('Not authorized');
            return;
        }
        let result = await dbEnergyDataService.getTransactionsForAccount(userId, req.params?.accountId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
});

// get billing for a number of accounts
app.post(`${standardsVersion}/energy/accounts/billing`, async (req: Request, res: Response, next: NextFunction) => {
    try {
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

        let result = await dbEnergyDataService.getBillingForMultipleAccounts(userId, req.body?.data?.accountIds)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
});


app.get(`${standardsVersion}/energy/accounts/:accountId/payment-schedule`, async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        if (accountIsValid(req.params?.accountId) == false) {
            res.status(401).json('Not authorized');
            return;
        }
        let result = await dbEnergyDataService.getPaymentSchedulesForAccount(userId, req.params?.accountId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
});

/******************* BANKING DATA  *********************************/

// anything /energy/accounts/<something-else> needs  to be routed like this 
// router.get(`${standardsVersion}/banking/accounts/:accountId`, async (req, res) => {

//     try {
//         let temp = req.headers?.authorization as string;
//         let tokenIsValid = await authService.verifyAccessToken(temp)
//         if (tokenIsValid == false) {
//             res.status(401).json('Not authorized');
//             return;
//         }
//         let userId = getUserId(req);
//         if (userId == undefined) {
//             res.status(401).json('Not authorized');
//             return;
//         }

//         console.log(`Received request on ${port} for ${req.url}`);
//         var excludes = ["directDebits", "payees", "payments"];
//         if (excludes.indexOf(req.params?.accountId) == -1) {
//             // if (accountIsValid(req.params?.accountId) == false) {
//             //     res.status(404).json('Not Found');
//             //     return;
//             // }
//             let result = await dbBankingDataService.getAccountDetail(userId, req.params?.accountId)
//             if (result == null) {
//                 res.sendStatus(404);
//             } else {
//                 result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
//                 res.send(result);
//             }
//         }
//         if (req.params?.accountId == "directDebits") {
//             let result = await dbBankingDataService.getDirectDebitsForAccount(userId, req.params?.accountId, req.query)
//             if (result == null) {
//                 res.sendStatus(404);
//             } else {
//                 res.send(result);
//             }
//         }

//         // if (req.params?.accountId == "payees") {
//         //     let result = await dbBankingDataService.getPayeeDetail(userId)
//         //     if (result == null) {
//         //         res.sendStatus(404);
//         //     } else {
//         //         res.send(result);
//         //     }
//         // }

//         if (req.params?.accountId == "payments") {
//             let result = await dbBankingDataService.getScheduledPaymentsForAccount(userId, req.params?.accountId, req.query)
//             if (result == null) {
//                 res.sendStatus(404);
//             } else {
//                 res.send(result);
//             }
//         }
//     } catch (e) {
//         console.log('Error:', e);
//         res.sendStatus(500);
//     }
// })

// this endpoint does NOT require authentication
app.get(`${standardsVersion}/banking/products/`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    try {
        let q = req.query as object;
        let result = await dbBankingDataService.getAllBankingProducts(q);
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }

});

app.get(`${standardsVersion}/banking/products/:productId`, async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log(`Received request on ${port} for ${req.url}`);
        let result = await dbBankingDataService.getBankingProductDetails(req.params.productId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }

});


app.get(`${standardsVersion}/banking/accounts/`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    try {
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
        let result = await dbBankingDataService.getAccounts(userId, req.query)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        } 
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }

});

// anything /energy/accounts/<something-else> needs  to be routed like this 
router.get(`${standardsVersion}/banking/accounts/:accountId`, async (req, res) => {
    console.log(`Received request on ${port} for ${req.url}....routing`);
    try {
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

        console.log(`Received request on ${port} for ${req.url}`);
        var excludes = ["direct-debits", "balances"];
        if (excludes.indexOf(req.params?.accountId) == -1) {
            if (accountIsValid(req.params?.accountId) == false) {
                res.status(404).json('Not Found');
                return;
            }
            let result = await dbBankingDataService.getAccountDetail(userId, req.params?.accountId)
            if (result == null) {
                res.sendStatus(404);
            } else {
                result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
                res.send(result);
            }
        }
        if (req.params?.accountId == "direct-debits") {
            let result = await dbBankingDataService.getBulkDirectDebits(userId, req.query)
            if (result == null) {
                res.sendStatus(404);
            } else {
                res.send(result);
            }
        }

        if (req.params?.accountId == "balances") {
            let result = await dbBankingDataService.getBulkBalances(userId, req.query)
            if (result == null) {
                res.sendStatus(404);
            } else {
                res.send(result);
            }
        }

    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
})

// app.get(`${standardsVersion}/banking/accounts/:accountId`, async (req: Request, res: Response, next: NextFunction) => {
//     console.log(`Received request on ${port} for ${req.url}`);
//     try {
//         console.log(`Received request on ${port} for ${req.url}`);
//         let temp = req.headers?.authorization as string;
//         let tokenIsValid = await authService.verifyAccessToken(temp)
//         if (tokenIsValid == false) {
//             res.status(401).json('Not authorized');
//             return;
//         }
//         let userId = getUserId(req);
//         if (userId == undefined) {
//             res.status(401).json('Not authorized');
//             return;
//         }
//         let result = await dbBankingDataService.getAccountDetail(userId, req.params.accountId);
//         if (result == null) {
//             res.sendStatus(404);
//         } else {
//             result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
//             res.send(result);
//         } 
//     } catch (e) {
//         console.log('Error:', e);
//         res.sendStatus(500);
//     }

// });

app.get(`${standardsVersion}/banking/accounts/:accountId/balance`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    try {
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
        let result = await dbBankingDataService.getAccountBalance(userId, req.params.accountId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        } 
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }

});

// app.get(`${standardsVersion}/banking/accounts/balances`, async (req: Request, res: Response, next: NextFunction) => {
//     console.log(`Received request on ${port} for ${req.url}`);
//     try {
//         console.log(`Received request on ${port} for ${req.url}`);
//         let temp = req.headers?.authorization as string;
//         let tokenIsValid = await authService.verifyAccessToken(temp)
//         if (tokenIsValid == false) {
//             res.status(401).json('Not authorized');
//             return;
//         }
//         let userId = getUserId(req);
//         if (userId == undefined) {
//             res.status(401).json('Not authorized');
//             return;
//         }
//         let result = await dbBankingDataService.getBulkBalances(userId, req.query)
//         if (result == null) {
//             res.sendStatus(404);
//         } else {
//             result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
//             res.send(result);
//         } 
//     } catch (e) {
//         console.log('Error:', e);
//         res.sendStatus(500);
//     }

// });

app.post(`${standardsVersion}/banking/accounts/balances`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    try {
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
        let result = await dbBankingDataService.getBalancesForSpecificAccounts(userId, req.body?.data?.accountIds, req.query)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        } 
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }

});

app.get(`${standardsVersion}/banking/accounts/:accountId/transactions`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    try {
        console.log(`Received request on ${port} for ${req.url}`);
        let temp = req.headers?.authorization as string;
        let tokenIsValid = await authService.verifyAccessToken(temp)
        if (tokenIsValid == false) {
            res.status(401).json('Not authorized');
            return;
        }
        let userId = getUserId(req);
        let q = req.query as object;
        if (userId == undefined) {
            res.status(401).json('Not authorized');
            return;
        }
        let result = await dbBankingDataService.getTransationsForAccount(userId, req.params.accountId, q)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        } 
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }

});

app.get(`${standardsVersion}/banking/accounts/:accountId/transactions/:transactionId`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    try {
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
        let result = await dbBankingDataService.getTransactionDetail(userId, req.params.accountId, req.params.transactionId)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        } 
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }

});

app.get(`${standardsVersion}/banking/payees/`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    try {
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
        let result = await dbBankingDataService.getPayees(userId, req.query)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        } 
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }

});

app.get(`${standardsVersion}/banking/payees/:payeeId`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    try {
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
        let result = await dbBankingDataService.getPayeeDetail(userId, req.params.payeeId)
        if (result == null) {
            res.status(404).json('Not Found');
            return;
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        } 
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }

});

app.get(`${standardsVersion}/banking/payments/scheduled`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    try {
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
        let result = await dbBankingDataService.getBulkScheduledPayments(userId, req.query)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        } 
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }

});

app.post(`${standardsVersion}/banking/payments/scheduled`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    try {
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
        let result = await dbBankingDataService.getScheduledPaymentsForAccountList(userId, req.body?.data?.accountIds, req.query)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        } 
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }

});

app.get(`${standardsVersion}/banking/accounts/:accountId/payments/scheduled`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    try {
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
        let result = await dbBankingDataService.getScheduledPaymentsForAccount(userId, req.params.accountId, req.query)
        if (result == null) {
            res.status(404).json('Not Found');
            return;
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        } 
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }

});

app.get(`${standardsVersion}/banking/accounts/:accountId/direct-debits`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    try {
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
        let result = await dbBankingDataService.getDirectDebitsForAccount(userId, req.params.accountId, req.query)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        } 
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }

});

// app.get(`${standardsVersion}/banking/accounts/direct-debits`, async (req: Request, res: Response, next: NextFunction) => {
//     console.log(`Received request on ${port} for ${req.url}`);
//     try {
//         console.log(`Received request on ${port} for ${req.url}`);
//         let temp = req.headers?.authorization as string;
//         let tokenIsValid = await authService.verifyAccessToken(temp)
//         if (tokenIsValid == false) {
//             res.status(401).json('Not authorized');
//             return;
//         }
//         let userId = getUserId(req);
//         if (userId == undefined) {
//             res.status(401).json('Not authorized');
//             return;
//         }
//         let result = await dbBankingDataService.getBulkDirectDebits(userId, req.query)
//         if (result == null) {
//             res.sendStatus(404);
//         } else {
//             result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
//             res.send(result);
//         } 
//     } catch (e) {
//         console.log('Error:', e);
//         res.sendStatus(500);
//     }

// });

app.post(`${standardsVersion}/banking/accounts/direct-debits`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    try {
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
        let result = await dbBankingDataService.getDirectDebitsForAccountList(userId, req.body?.data?.accountIds, req.query)
        if (result == null) {
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        } 
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }

});

// Get the information required by the Auth server to displaythe login screen
app.get(`/login-data/:sector`, async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log(`Received request on ${port} for ${req.url}`);
        if (sectorIsValid(req.params?.sector) == false) {
            res.status(404).json('Not Found');
            return;
        }
        let sectors: string[] = [];
        // TODO temp fix, need to rething this
        // if (req.params?.sector == null) {
        if (true) {
            sectors.push('banking');
            sectors.push('energy');
        }
        let customers = await dbAuthDataService.getLoginInformation(sectors);
        if (customers == undefined) customers = [];
        let result = { Customers: customers };
        res.send(result);
    } catch (e) {
        console.log('Error:', e);
        res.sendStatus(500);
    }
});

// In the absence of an IdP we use the accessToken as userId
function getUserId(req: any): string | undefined {
    return authService?.authUser?.customerId;
}

function accountIsValid(accountId: string): boolean {
    let idx = authService?.authUser?.accounts?.findIndex(x => x == accountId)
    return (idx != undefined && idx > -1);
}

function sectorIsValid(sector: string): boolean {
    let validSectors = ['energy', 'banking']
    let st = sector.toLowerCase();
    return validSectors.indexOf(st) > -1
}


