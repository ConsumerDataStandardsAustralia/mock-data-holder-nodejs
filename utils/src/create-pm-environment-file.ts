/* Created for testing purposes. 
    In order to test generated data from test cli the postman collections from dsb-postman can be used

    This will create a Postman environment file with ids
*/

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const envName = 'test-data-env'

const dataInput = path.join(__dirname, '/data/complete-data.json')
const postmanEnvironmentFile = path.join(__dirname, `/data/out/${envName}.json`)

const sourceData: any = JSON.parse(readFileSync(dataInput, 'utf8'));

let holders = sourceData?.holders;
let prodIds: any[] = [];
let planIds: any[] = [];
let servicePointIds: any[] = [];
let energyAccountIds: any[] = [];
let bankingPayeeIds: any[] = [];
let bankingAccountIds: any[] = [];
let bankingTransactionIds: any[] = [];
let bankingPaymentIds: any[] = [];



holders?.forEach((h: any) => {
    let products = h.holder?.unauthenticated?.banking?.products;
    let cnt = 0;
    products?.forEach((p: any) => {
        cnt++;
        let id = p?.productId;
        if (id != null) {
            let obj = {
                key: `productId${cnt}`,
                value: `${id}`

            }
            prodIds.push(obj);
        }        
    });
    cnt = 0;
    let plans = h.holder?.unauthenticated?.energy?.plans;
    plans?.forEach((p: any) => {
        cnt++;
        let id = p?.planId;
        if (id != null) {
            let obj = {
                key: `planId${cnt}`,
                value: `${id}`

            }
            planIds.push(obj);
        }        
    });
    
    let customers = h.holder?.authenticated?.customers;
    customers?.forEach((cust:any) => {
        cnt = 0;
        let trxIdx = 0;
        let accounts = cust?.banking?.accounts;
        accounts?.forEach((ac:any) => {
            cnt++;
            let id = ac?.account.accountId
            let obj = {
                key: `accountId${cnt}`,
                value: `${id}`

            }
            bankingAccountIds.push(obj);  

            
            let transactions = ac?.transactions;
            transactions?.forEach((tr:any) => {
                trxIdx++;
                let id = tr?.transactionId;
                let obj = {
                    key: `transactionId${trxIdx}`,
                    value: `${id}`
    
                }
                bankingTransactionIds.push(obj);         
            })      
        })
        cnt = 0;
        let payees = cust?.banking?.payees;
        payees?.forEach((p:any) => {
            cnt++;
            let id = p?.payeeId
            let obj = {
                key: `payeeId${cnt}`,
                value: `${id}`

            }
            bankingPayeeIds.push(obj);       
        })
        cnt = 0;
        let payments = cust?.banking?.payments;
        payments?.forEach((p:any) => {
            cnt++;
            let id = p?.scheduledPaymentId
            let obj = {
                key: `paymentId${cnt}`,
                value: `${id}`

            }
            bankingPaymentIds.push(obj);       
        })
        cnt = 0;
        let energyAccounts = cust?.energy?.accounts;
        energyAccounts?.forEach((ac:any)=> {
            cnt++;
            let id = ac?.account.accountId
            let obj = {
                key: `energyAccountID${cnt}`,
                value: `${id}`

            }
            energyAccountIds.push(obj);  
        })
        cnt = 0;
        let servicePoints = cust?.energy?.servicePoints;
        servicePoints?.forEach((ac:any)=> {
            cnt++;
            let id = ac?.servicePoint.servicePointId
            let obj = {
                key: `servicePointId${cnt}`,
                value: `${id}`

            }
            servicePointIds.push(obj);  
        })
    });

});


let retObj: any = {
    "name": `${envName}`,
   
    // "accessToken": "",
    // "primaryDataHolderUrl": "https://mtls-gateway:8082/resource/cds-au/v1",
    // "secondaryDataHolderUrl": "https://mtls-gateway:8082/resource/cds-au/v1",
    // "authenticatedResourceUrl": "https://mtls-gateway:8082/resource/cds-au/v1",
    // "unauthenticatedResourceUrl": "https://mtls-gateway:8082/resource/cds-au/v1",
    // "x-fapi-interaction-id": "2a5a065b-d991-41de-b303-2aad52caea79",
    // "x-fapi-customer-ip-address": "127.0.0.1",
    // "x-cds-client-headers": "Q29uc3VtZXIgRGF0YSBSaWdodA=="
}

let commonValues = [];
commonValues.push({
    key: "version",
    value: "1.26.0"
})
commonValues.push({
    key: "accessToken",
    value: ""
})
commonValues.push({
    key: "primaryDataHolderUrl",
    value: "https://mtls-gateway:8082/resource/cds-au/v1"
})
commonValues.push({
    key: "secondaryDataHolderUrl",
    value: "https://mtls-gateway:8082/resource/cds-au/v1"
})
commonValues.push({
    key: "authenticatedResourceUrl",
    value: "https://mtls-gateway:8082/resource/cds-au/v1"
})
commonValues.push({
    key: "unauthenticatedResourceUrl",
    value: "https://mtls-gateway:8082/resource/cds-au/v1"
})
commonValues.push({
    key: "x-fapi-interaction-id",
    value: "2a5a065b-d991-41de-b303-2aad52caea79"
})
commonValues.push({
    key: "x-fapi-customer-ip-address",
    value: "127.0.0.1"
})
commonValues.push({
    key: "x-cds-client-headers",
    value: "Q29uc3VtZXIgRGF0YSBSaWdodA=="
})

let allValues = commonValues.concat(prodIds, planIds, bankingAccountIds, bankingPayeeIds, bankingPaymentIds, bankingTransactionIds, energyAccountIds, servicePointIds);
retObj.values = allValues;

writeFileSync(postmanEnvironmentFile, JSON.stringify(retObj, null, 2))


