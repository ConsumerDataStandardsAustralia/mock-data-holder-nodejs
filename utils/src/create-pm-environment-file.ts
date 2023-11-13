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
let servicePointsIds: any[] = [];
let energyAccountIds: any[] = [];
let bankingPayeeIds: any[] = [];
let energyTransdactionIds: any[] = [];
let bankingAccountIds: any[] = [];
let bankingTransactionIds: any[] = [];
let bankingPaymentIds: any[] = [];
let directDebitAccountIds: any[] = [];


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
    });

});

let writeString = `{ "name": "${envName}", "values": [`;

if (prodIds?.length > 0) {
    /* write the product id */
    let prdCnt = prodIds?.length;
    let prodID = 0;
    prodIds?.forEach((p: any) => {
        prodID++;
        const json = JSON.stringify(p, null, 2);
        if (prodID < prdCnt)
            writeString = writeString + json + ","; 
        else 
            writeString = writeString + json;
    });
    writeString = writeString + ",";
}

if (bankingAccountIds?.length > 0) {
    /* write the product id */
    let cnt = bankingAccountIds?.length;
    let idx = 0;
    bankingAccountIds?.forEach((p: any) => {
        idx++;
        const json = JSON.stringify(p, null, 2);
        if (idx < cnt)
            writeString = writeString + json + ","; 
        else 
            writeString = writeString + json;
    });
    writeString = writeString + ",";
}

if (bankingPayeeIds?.length > 0) {
    /* write the product id */
    let cnt = bankingPayeeIds?.length;
    let idx = 0;
    bankingPayeeIds?.forEach((p: any) => {
        idx++;
        const json = JSON.stringify(p, null, 2);
        if (idx < cnt)
            writeString = writeString + json + ","; 
        else 
            writeString = writeString + json;
    });
    writeString = writeString + ",";
}

if (bankingPaymentIds?.length > 0) {
    /* write the product id */
    let cnt = bankingPaymentIds?.length;
    let idx = 0;
    bankingPaymentIds?.forEach((p: any) => {
        idx++;
        const json = JSON.stringify(p, null, 2);
        if (idx < cnt)
            writeString = writeString + json + ","; 
        else 
            writeString = writeString + json;
    });
    writeString = writeString + ",";
}

if (bankingTransactionIds?.length > 0) {
    /* write the product id */
    let cnt = bankingTransactionIds?.length;
    let idx = 0;
    bankingTransactionIds?.forEach((p: any) => {
        idx++;
        const json = JSON.stringify(p, null, 2);
        if (idx < cnt)
            writeString = writeString + json + ","; 
        else 
            writeString = writeString + json;
    });
}

writeString = writeString + "]}";
writeFileSync(postmanEnvironmentFile,writeString);

