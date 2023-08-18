import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const dataCliFile = path.join(__dirname, '/data/my-created-combined.json')
const seedDataBankingOutput = path.join(__dirname, '/data/out/seed-data-banking.json')
const seedDataEnergyOutput = path.join(__dirname, '/data/out/seed-data-energy.json')

const sourceData: any = readFileSync(dataCliFile, 'utf8');
const sourceObj = JSON.parse(sourceData)
let outputDataBanking: any = {}
let outputDataEnergy: any = {}
let customersBanking: any[] = [];
let customersEnergy: any[] = [];

sourceObj.holders[0]?.holder?.authenticated?.customers?.forEach((c:any) => {
    let custBanking:any = {}
    let custEnergy:any = {}
    let person: any = {};
    let accountListBanking: any[] = [];
    let accountListEnergy: any[] = [];
    custBanking.CustomerID = c.customerId;
    custBanking.CustomerUType = c.customer?.customerUType;
    custBanking.LoginId = `${c.customer?.person?.lastName}.${c.customer?.person?.firstName}`;
    custEnergy.CustomerID = c.customerId;
    custEnergy.CustomerUType = c.customer?.customerUType;
    custEnergy.LoginId = `${c.customer?.person?.lastName}.${c.customer?.person?.firstName}`;

    
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
    custBanking.Person = person;
    custEnergy.Person = person;
    // banking accounts
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
        accountListBanking.push(acc);
    });

    c.energy?.accounts?.forEach((a:any) => {
        let acc: any = {};
        acc.AccountId = a.account?.accountId;
        acc.AccountNumber = a.account?.accountNumber ;
        acc.DisplayName = a.account?.displayName ;
        acc.CreationDate = a.account?.creationDate ;
        accountListEnergy.push(acc);
    });
    custBanking.Accounts = accountListBanking;
    custEnergy.Accounts = accountListEnergy;
    customersBanking.push(custBanking);
    customersEnergy.push(custEnergy);
});

outputDataBanking.Customers = customersBanking;
outputDataEnergy.Customers = customersEnergy;

writeFileSync(seedDataBankingOutput,JSON.stringify(outputDataBanking))
writeFileSync(seedDataEnergyOutput,JSON.stringify(outputDataEnergy))


