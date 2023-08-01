import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const dataCliFile = path.join(__dirname, '/data/my-created-combined.json')
const seedDataOutput = path.join(__dirname, '/data/out/seed-data.json')

// "CustomerID": "4ee1a8db-13af-44d7-b54b-e94dff3df548",
// "CustomerUType": "person",
// "LoginId": "jsmith",
// "Person": {
//     "PersonID": "be36d5b8-8d92-4076-81c1-2260ba7e7272",
//     "FirstName": "John",
//     "LastName": "Smith",
//     "MiddleNames": "",
//     "Prefix": "Mr",
//     "Suffix": null,
//     "OccupationCode": null,
//     "OccupationCodeVersion": null,
//     "LastUpdateTime": "2021-04-30T08:00:00Z"
// },
// "Accounts": [
//     {
//         "AccountId": "1122334455",
//         "CreationDate": "2015-01-01",
//         "DisplayName": "Savings Account",
//         "NickName": "Savings",
//         "OpenStatus": "OPEN",
//         "MaskedName": "xxx-xxx xxxxx455",
//         "ProductCategory": "TRANS_AND_SAVINGS_ACCOUNTS",
//         "ProductName": "Everyday Savings"
//     }
// ]

const sourceData: any = readFileSync(dataCliFile, 'utf8');
const sourceObj = JSON.parse(sourceData)
let outputData: any = {}
let customers: any[] = [];

sourceObj.holders[0]?.holder?.authenticated?.customers?.forEach((c:any) => {
    let cust:any = {}
    let person: any = {};
    let accountList: any[] = [];
    cust.CustomerID = c.customerId;
    cust.CustomerUType = c.customer?.customerUType;
    cust.LoginId = c.customer?.person?.lastName;
    // Person
    person.PersonID = c.customerId;
    person.firstName = c.customer?.person?.firstName;
    person.lastName = c.customer?.person?.lastName;
    person.MiddleNames = c.customer?.person?.middleName;
    person.Prefix = c.customer?.person?.prefix;
    person.Suffix = c.customer?.person?.suffix;
    person.OccupationCode= c.customer?.person?.occupationCode;
    person.OccupationCodeVersion = c.customer?.person?.occupationCodeVersion;
    person.LastUpdateTime = c.customer?.person?.lastUpdateTime;  
    cust.Person = person;
 
    // accounts
    c.banking?.accounts?.forEach((a:any) => {
        let acc: any = {};
        acc.AccountId = a.account?.accountId;
        acc.CreationDate = a.account?.creationDate ;
        acc.DisplayName = a.account?.displayName ;
        acc.NickName = a.account?.nickName ;
        acc.OpenStatus = a.account?.openStatus ;
        acc.MaskedName = a.account?.maskedNumber ;
        acc.ProductCategory  = a.account?.productCategory ;
        acc.ProductName = a.account?.productCategory ;
        accountList.push(acc);
    });
    cust.Accounts = accountList;
    customers.push(cust)
});

outputData.Customers = customers;


writeFileSync(seedDataOutput,JSON.stringify(outputData))


