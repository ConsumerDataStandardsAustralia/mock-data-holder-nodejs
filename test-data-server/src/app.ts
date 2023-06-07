import express, { request }  from 'express';
import {NextFunction, Request, Response} from 'express';
import endpoints from './data/endpoints.json';
import { EndpointConfig, CdrConfig, cdrHeaderValidator, DefaultBankingEndpoints,
    DefaultEnergyEndpoints}  from '@cds-au/holder-sdk'
import { MongoData } from './services/database.service';
import { IDatabase } from './services/database.interface';

import bodyParser from 'body-parser';
import * as dotenv from 'dotenv'; 
import { SingleData } from './services/single.service';

dotenv.config();
console.log(JSON.stringify(process.env, null, 2))

const exp = express;
const app = express();
const port = 3005;


let standardsVersion = '/cds-au/v1';

const router = exp.Router();

// this middle ware will handle the boilerplate validation and setting for a number of header parameters
// For more information on how to use and set up refer to the js-holder demo project 
// https://github.com/ConsumerDataStandardsAustralia/js-holder-sdk-demo
const sampleEndpoints = [...endpoints] as EndpointConfig[];
const dsbOptions: CdrConfig = {
    endpoints: sampleEndpoints
}
app.use(cdrHeaderValidator(dsbOptions));


// This implementation uses a MongoDB. To use some other persistent storage
// you need to implement the IDatabase interface
const connString = `mongodb://${process.env.MONGO_HOSTNAME}:${process.env.MONGO_PORT}`

const dbHost = `${process.env.DB_HOST}`
const dbPort = `${process.env.DB_PORT}`
console.log(`Connection string is ${connString}`);
console.log(`Hosted on ${process.env.DB_HOST}:${process.env.DB_PORT}`)
var dbService: IDatabase;
dbService = new MongoData(connString, process.env.MONGO_DB as string);


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
//app.use(express.json({limit: '50mb' }));
app.use('/', router);

// anything /energy/accounts/<something-else> needs  to be routed like this 
router.get(`${standardsVersion}/energy/accounts/:accountId`, async (req, res) => {
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    console.log(`Received request on ${port} for ${req.url}`);
    var excludes = ["invoices", "billing", "balances"];
    if (excludes.indexOf(req.params?.accountId) == -1){
        let result = await dbService.getEnergyAccountDetails(userId, req.params?.accountId)
        if (result == null){
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    }
    if (req.params?.accountId == "invoices") {
        let result = await dbService.getBulkInvoicesForUser(userId)
        if (result == null){
            res.sendStatus(404);
        } else {
            res.send(result);
        }
    }

    if (req.params?.accountId == "billing") {
        let result = await dbService.getBulkBilllingForUser(userId)
        if (result == null){
            res.sendStatus(404);
        } else {
            res.send(result);
        }
    }

    if (req.params?.accountId == "balances") {
        let result = await dbService.getBulkBalancesForUser(userId)
        if (result == null){
            res.sendStatus(404);
        } else {
            res.send(result);
        }
    }
})

// anything /energy/electricity/servicepoints/<something-else> needs  to be routed like this 
router.get(`${standardsVersion}/energy/electricity/servicepoints/:servicePointId`, async (req, res) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    var excludes = ["usage", "der"];
    if (excludes.indexOf(req.params?.servicePointId) == -1){
        let result = await dbService.getServicePointDetails(userId, req.params?.servicePointId)
        if (result == null){
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    }
    if (req.params?.servicePointId == "usage") {
        console.log(`Received request on ${port} for ${req.url}`);
        let result = await dbService.getBulkUsageForUser(userId)
        if (result == null){
            res.sendStatus(404);
        } else {
            result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.send(result);
        }
    }

    if (req.params?.servicePointId == "der") {
        let result = await dbService.getBulkDerForUser(userId)
        if (result == null){
            res.sendStatus(404);
        } else {
            res.send(result);
        }
    }
})

// this endpoint requires authentication
app.get(`${standardsVersion}/energy/accounts`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let userId: any = user(req);
    if (user(req) == undefined){
        res.status(401);
        return;
    }
    let ret = await dbService.getEnergyAccounts(userId);
    ret.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
    res.send(ret);
});

// tget list of service points, returns EnergyServicePointListResponse
app.get(`${standardsVersion}/energy/electricity/servicepoints`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    let result = await dbService.getServicePoints(userId);
    if (result == null){
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

app.get(`${standardsVersion}/common/customer/detail`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    let result = await dbService.getCustomerDetails(userId);
    if (result == null){
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

app.get(`${standardsVersion}/common/customer`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    let result = await dbService.getCustomerDetails(userId);
    if (result == null){
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});


app.get(`${standardsVersion}/energy/plans/:planId`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);

    let result = await dbService.getEnergyPlanDetails(req.params.planId)
    if (result == null){
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// this endpoint does NOT require authentication
app.get(`${standardsVersion}/energy/plans/`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let userId: any = user(req);
    let result = await dbService.getEnergyAllPlans()
    if (result == null){
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// get usage fort a service point, returns EnergyUsageListResponse
app.get(`${standardsVersion}/energy/electricity/servicepoints/:servicePointId/usage`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    let result = await dbService.getUsageForServicePoint(userId, req.params.servicePointId)
    if (result == null){
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }

});


// get der for a service point, returns EnergyDerDetailResponse
app.get(`${standardsVersion}/energy/electricity/servicepoints/:servicePointId/der`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    let result = await dbService.getDerForServicePoint(userId, req.params.servicePointId);
    if (result == null){
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }

});

// get der for a service point, returns EnergyDerDetailResponse
app.post(`${standardsVersion}/energy/electricity/servicepoints/der`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    let result = await dbService.getDerForMultipleServicePoints(userId, req.body?.accountIds)
    if (result == null){
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// get account details for an accountID, returns EnergyAccountDetailResponseV2
app.get(`${standardsVersion}/energy/accounts/:accountId`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    var excludes = ["invoices"];
    if (excludes.indexOf(req.params?.accountId) == -1){
        let result = await dbService.getEnergyAccountDetails(userId, req.params?.accountId)
        if (result == null){
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
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    let result = await dbService.getInvoicesForAccount(userId, req.params?.accountId)
    if (result == null){
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// get invoices for account, returns EnergyInvoiceListResponse
app.get(`${standardsVersion}/energy/accounts/:accountId/invoices`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    let result = await dbService.getInvoicesForAccount(userId,req.params.accountId)
    if (result == null){
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// get invoices for account, returns EnergyInvoiceListResponse
app.post(`${standardsVersion}/energy/accounts/invoices`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received POST request on ${port} for ${req.url}`);
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    let result = await dbService.getInvoicesForMultipleAccounts(userId, req.body?.data?.accountIds)
    if (result == null){
        res.sendStatus(404);
    } else {
        res.send(result);
    }
});

// get invoices for account, returns EnergyInvoiceListResponse
app.get(`${standardsVersion}/energy/accounts/invoices`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received GET request on ${port} for ${req.url}`);
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    let result = await dbService.getBulkInvoicesForUser(userId)
    if (result == null){
        res.sendStatus(404);
    } else {
        res.send(result);
    }
});

// get invoices for account, returns EnergyInvoiceListResponse
app.post(`${standardsVersion}/energy/electricity/servicepoints/usage`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    let result = await dbService.getUsageForMultipleServicePoints(userId, req.body?.data?.servicePointIds)
    if (result == null){
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// get concessions for account, returns EnergyConcessionsResponse
app.get(`${standardsVersion}/energy/accounts/:accountId/concessions`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    let result = await dbService.getConcessionsForAccount(userId, req.params?.accountId)
    if (result == null){
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});


// get balance for account, returns EnergyBalanceResponse
app.get(`${standardsVersion}/energy/accounts/:accountId/balance`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    let st = `Received request on ${port} for ${req.url}`;
    let result = await dbService.getBalanceForAccount(userId, req.params?.accountId)
    if (result == null){
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// get payment schedule for account, returns EnergyPaymentScheduleResponse
app.get(`${standardsVersion}/energy/accounts/:accountId/payment-schedule`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    let result = await dbService.getPaymentSchedulesForAccount(userId, req.params?.accountId)
    if (result == null){
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// get payment schedule for account, returns EnergyPaymentScheduleResponse
app.get(`${standardsVersion}/energy/accounts/:accountId/billing`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    let result = await dbService.getTransactionsForAccount(userId, req.params?.accountId)
    if (result == null){
        res.sendStatus(404);
    } else {
        res.send(result);
    }
});

// get billing for a number of accounts
app.post(`${standardsVersion}/energy/accounts/billing`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    let result = await dbService.getBillingForMultipleAccounts(userId, req.body?.data?.accountIds)
    if (result == null){
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});

// get billing for a number of accounts
app.post(`${standardsVersion}/energy/accounts/balances`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let userId: any = user(req);
    if (user(req) == undefined){
        res.sendStatus(401);
        return;
    }
    let result = await dbService.getBalancesForMultipleAccount(userId, req.body?.data?.accountIds)
    if (result == null){
        res.sendStatus(404);
    } else {
        result.links.self = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.send(result);
    }
});


dbService.connectDatabase()
    .then(() => {
        app.listen(port, dbHost, () => {
            console.log(`Server running at http://${dbHost}:${dbPort}/`);
            console.log('Listening for requests....');
        });
    })
    .catch((error: Error) => {
        console.error("Database connection failed", error);
        process.exit();
    })


// In the absence of an IdP we use the accessToken as userId
function user(req: any): string| undefined {   
        let temp = req.headers?.authorization as string;
        return temp?.split(" ")[1];
}