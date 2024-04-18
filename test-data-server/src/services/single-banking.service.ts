// import { Service } from "typedi";
// import { IBankingData } from "./database-banking.interface";
// import { AccountModel, CustomerModel } from "../models/login";
// import * as mongoDB from "mongodb";
// import { BankingAccountDetailV3, BankingAccountV2, BankingBalance, BankingDirectDebit, BankingPayeeDetailV2, BankingPayeeV2, BankingProductDetailV4, BankingProductV4, BankingScheduledPaymentV2, Links, LinksPaginated, Meta, MetaPaginated, ResponseBankingAccountListV2 } from "consumer-data-standards/banking";

// @Service()
// export class BankingDataSingle  {

//     public collections: mongoDB.Collection[] = [];
//     private client: mongoDB.MongoClient;
//     private dsbData: mongoDB.Db;
//     private dsbName: string;

//     constructor(connString: string, dbName: string) {
//         this.client = new mongoDB.MongoClient(connString, { monitorCommands: true });
//         this.dsbName = dbName;
//         this.dsbData = this.client.db(dbName);
//     }

//     async getAccounts(customerId: string, queryParameters: any): Promise<any> {
//         let ret: any = {};
//         let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);

//         let customer = await this.getCustomer(allDataCollection, customerId);
//         let retArray: BankingAccountV2[] = [];
//         if (customer?.banking?.accounts == null) {
//             ret.data = { accounts: retArray };
//         } else {
//             customer?.banking?.accounts.forEach((p: any) => {
//                 let account: BankingAccountV2 = {
//                     accountId: p.account.accountId,
//                     accountOwnership: p.account.accountOwnership,
//                     displayName: p.account.displayName,
//                     maskedNumber: p.account.maskedNumber,
//                     productCategory: p.account.productCategory,
//                     productName: p.account.productName
//                 } ;
//                 if (p.account.creationDate != null ) account.creationDate = p.account.creationDate;
//                 if (p.account.nickname != null ) account.nickname = p.account.nickname;
//                 if (p.account.openStatus != null ) account.openStatus = p.account.openStatus;
//                 if (p.account.isOwned != null ) account.isOwned = p.account.isOwned;
//                 retArray.push(account);      
//             });       
//             ret.data = { accounts: retArray };
//         }

//         let l: LinksPaginated = {
//             self: ""
//         }
//         let m: MetaPaginated = {
//             totalPages: 0,
//             totalRecords: 0
//         }
//         ret.links = l;
//         ret.meta = m;
//         return ret;
//     }

//     async getAccountDetail(customerId: string, accountId: string): Promise<any> {
//         let ret: any = {};
//         let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);

//         let customer = await this.getCustomer(allDataCollection, customerId);
//         //let retArray: BankingAccountV2[] = [];
//         if (customer?.banking?.accounts == null) {
//             ret.data = {};
//         } else {
//             let accounts = customer?.banking?.accounts.filter((x: any) => {
//                 if (x.account.accountId == accountId)
//                     return x;
//             })
  
//             ret.data = accounts[0]?.account;
//         }

//         let l: Links = {
//             self: ""
//         }
//         let m: Meta= {}
//         ret.links = l;
//         ret.meta = m;
//         return ret;
//     }
//     async getTransationsForAccount(customerId: string, accountId: string, queryParameters: any): Promise<any> {
//         let ret: any = {};
//         let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);

//         let customer = await this.getCustomer(allDataCollection, customerId);
//         //let retArray: BankingAccountV2[] = [];
//         if (customer?.banking?.accounts == null) {
//             ret.data = {};
//         } else {
//             let accounts = customer?.banking?.accounts.filter((x: any) => {
//                 if (x.account.accountId == accountId)
//                     return x;
//             })
//             let data = { };
//             ret.data = data;
//             ret.data.transactions = accounts[0]?.transactions;
//         }

//         let l: LinksPaginated = {
//             self: ""
//         }
//         let m: MetaPaginated = {
//             totalPages: 0,
//             totalRecords: 0
//         }
//         ret.links = l;
//         ret.meta = m;
//         return ret;
//     }
//     async getTransactionDetail(customerId: string, accountId: string, transactionId: string): Promise<any> {
//         let ret: any = {};
//         let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);

//         let customer = await this.getCustomer(allDataCollection, customerId);
//         //let retArray: BankingAccountV2[] = [];
//         if (customer?.banking?.accounts == null) {
//             ret.data = {};
//         } else {
//             let account = customer?.banking?.accounts.find((x: any) => {
//                 if (x?.account?.accountId == accountId)
//                     return x;
//             });

//             let transaction = account?.transactions.find((x: any) => {
//                 if (x?.transactionId == transactionId)
//                     return x;
//             });
  
//             ret.data = transaction;
//         }

//         let l: Links = {
//             self: ""
//         }
//         let m: Meta= {}
//         ret.links = l;
//         ret.meta = m;
//         return ret;
//     }
//     async getBulkBalances(customerId: string, queryParameters: any): Promise<any> {
//         let ret: any = {};
//         let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
//  
//         let customer = await this.getCustomer(allDataCollection, customerId);
//         let retArray: BankingBalance[] = [];
//         if (customer?.banking?.accounts == null) {
//             ret.data = { balances: retArray };
//         } else { 
//             customer.banking.accounts.forEach((acc:any) => {
//                 if (acc?.balance != null)
//                     retArray.push(acc.balance)
//             });  
//             ret.data = { balances: retArray };
//         }

//         let l: LinksPaginated = {
//             self: ""
//         }
//         let m: MetaPaginated = {
//             totalPages: 0,
//             totalRecords: 0
//         }
//         ret.links = l;
//         ret.meta = m;
//         return ret;
//     }
//     async getAccountBalance(customerId: string, accountId: string): Promise<any> {
//         let ret: any = {};
//         let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
//  
//         let customer = await this.getCustomer(allDataCollection, customerId);

//         if (customer?.banking?.accounts == null) {
//             ret.data = { };
//         } else { 

//             let accounts =  customer?.banking?.accounts.find((x:any) => x.account?.accountId == accountId)
//             ret.data = accounts?.balance;
//         }
//         let l: Links = {
//             self: ""
//         }
//         let m: Meta= {}
//         ret.links = l;
//         ret.meta = m;
//         return ret;
//     }
//     async getBalancesForSpecificAccounts(customerId: string, accountIds: string[], queryParameters: any): Promise<any> {
//         let ret: any = {};
//         let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
//  
//         let customer = await this.getCustomer(allDataCollection, customerId);
//         let retArray: BankingBalance[] = [];
//         if (customer?.banking?.accounts == null) {
//             ret.data = { balances: retArray };
//         } else { 
//             let accounts: any[] = [];
//             accountIds.forEach((id: string) => {
//                 accounts = customer?.banking?.accounts.filter((x: any) => {
//                     if (x.account?.accountId == id && x?.balance != null) {
//                         retArray.push(x.balance);
//                     }
                        
//                 })
//             })
//             ret.data = { balances: retArray };
//         }

//         let l: LinksPaginated = {
//             self: ""
//         }
//         let m: MetaPaginated = {
//             totalPages: 0,
//             totalRecords: 0
//         }
//         ret.links = l;
//         ret.meta = m;
//         return ret;
//     }
    
//     async getDirectDebitsForAccount(customerId: string, accountId: string, queryParameters: any): Promise<any> {
//         let ret: any = {};
//         let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);

//         let customer = await this.getCustomer(allDataCollection, customerId);
//         let retArray: BankingDirectDebit[] = [];
//         if (customer?.banking?.directDebits == null) {
//             ret.data = { directDebitAuthorisations: retArray };
//         } else {
//             let debits = customer?.banking?.directDebits.filter((x: any) => {
//                 if (x.accountId == accountId)
//                     return x;
//             })
  
//             ret.data = { directDebitAuthorisations: debits };
//         }
//         let l: LinksPaginated = {
//             self: ""
//         }
//         let m: MetaPaginated = {
//             totalPages: 0,
//             totalRecords: 0
//         }
//         ret.links = l;
//         ret.meta = m;
//         return ret;
//     }
//     async getDirectDebitsForAccountList(customerId: string, accountIds: string[], queryParameters: any): Promise<any> {
//         let ret: any = {};
//         let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
//  
//         let customer = await this.getCustomer(allDataCollection, customerId);
//         let retArray: BankingDirectDebit[] = [];
//         if (customer?.banking?.directDebits == null) {
//             ret.data = { directDebitAuthorisations: retArray};
//         } else { 
//             let debits: any[] = [];
//             accountIds.forEach((id: string) => {
//                 debits = customer?.banking?.directDebits.filter((x: any) => {
//                     if (x?.accountId == id) {
//                         retArray.push(x);
//                     }
                        
//                 })
//             })
//             ret.data = { directDebitAuthorisations: retArray };
//         }

//         let l: LinksPaginated = {
//             self: ""
//         }
//         let m: MetaPaginated = {
//             totalPages: 0,
//             totalRecords: 0
//         }
//         ret.links = l;
//         ret.meta = m;
//         return ret;
//     }
//     async getBulkDirectDebits(customerId: string, queryParameters: any): Promise<any> {
//         let ret: any = {};
//         let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
//  
//         let customer = await this.getCustomer(allDataCollection, customerId);
//         let retArray: BankingDirectDebit[] = [];
//         if (customer?.banking?.directDebits == null) {
//             ret.data = { directDebitAuthorisations: retArray };
//         } else { 
//             ret.data = { directDebitAuthorisations: customer?.banking?.directDebits };
//         }

//         let l: LinksPaginated = {
//             self: ""
//         }
//         let m: MetaPaginated = {
//             totalPages: 0,
//             totalRecords: 0
//         }
//         ret.links = l;
//         ret.meta = m;
//         return ret;
//     }

//     async getScheduledPaymentsForAccount(customerId: string, accountId: string, queryParameters: any): Promise<any> {
//         let ret: any = {};
//         let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);

//         let customer = await this.getCustomer(allDataCollection, customerId);
//         let retArray: BankingScheduledPaymentV2[] = [];
//         if (customer?.banking?.payments == null) {
//             ret.data = { scheduledPayments: retArray };
//         } else {
//             let payments = customer?.banking?.payments.filter((x: any) => {
//                 if (x.from.accountId == accountId)
//                     return x;
//             })
  
//             ret.data = { scheduledPayments: payments };
//         }
//         let l: LinksPaginated = {
//             self: ""
//         }
//         let m: MetaPaginated = {
//             totalPages: 0,
//             totalRecords: 0
//         }
//         ret.links = l;
//         ret.meta = m;
//         return ret;
//     }

//     async getScheduledPaymentsForAccountList(customerId: string, accountIds: string[], queryParameters: any): Promise<any> {
//         let ret: any = {};
//         let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
//  
//         let customer = await this.getCustomer(allDataCollection, customerId);
//         let retArray: BankingScheduledPaymentV2[] = [];
//         if (customer?.banking?.payments == null) {
//             ret.data = { scheduledPayments: retArray};
//         } else { 
//             let payments: any[] = [];
//             accountIds.forEach((id: string) => {
//                 payments = customer?.banking?.payments.filter((x: any) => {
//                     if (x.from?.accountId == id) {
//                         retArray.push(x);
//                     }
                        
//                 })
//             })
//             ret.data = { scheduledPayments: retArray };
//         }

//         let l: LinksPaginated = {
//             self: ""
//         }
//         let m: MetaPaginated = {
//             totalPages: 0,
//             totalRecords: 0
//         }
//         ret.links = l;
//         ret.meta = m;
//         return ret;
//     }

//     async getBulkScheduledPayments(customerId: string, queryParameters: any): Promise<any> {
//         let ret: any = {};
//         let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
//  
//         let customer = await this.getCustomer(allDataCollection, customerId);
//         let retArray: BankingScheduledPaymentV2[] = [];
//         if (customer?.banking?.payments == null) {
//             ret.data = { scheduledPayments: retArray };
//         } else {     
//             ret.data = { scheduledPayments: customer?.banking?.payments };
//         }

//         let l: LinksPaginated = {
//             self: ""
//         }
//         let m: MetaPaginated = {
//             totalPages: 0,
//             totalRecords: 0
//         }
//         ret.links = l;
//         ret.meta = m;
//         return ret;
//     }

//     async getPayees(customerId: string, queryParameters: any): Promise<any> {
//         let ret: any = {};
//         let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);

//         let customer = await this.getCustomer(allDataCollection, customerId);
//         let retArray: BankingPayeeV2[] = [];
//         if (customer?.banking?.payees == null) {
//             ret.data = { payees: retArray };
//         } else {
//             customer?.banking?.payees.forEach((p: BankingPayeeDetailV2) => {
//                 let payee: BankingPayeeV2 = {
//                     nickname: p.nickname,
//                     payeeId: p.payeeId,
//                     type: p.type
//                 } ;
//                 if (p.creationDate != null ) payee.creationDate = p.creationDate;
//                 if (p.description != null ) payee.description = p.description;

//                 retArray.push(payee);      
//             });       
//             ret.data = { payees: retArray };
//         }

//         let l: LinksPaginated = {
//             self: ""
//         }
//         let m: MetaPaginated = {
//             totalPages: 0,
//             totalRecords: 0
//         }
//         ret.links = l;
//         ret.meta = m;
//         return ret;
//     }

//     async getPayeeDetail(customerId: string, payeeId: string): Promise<any> {
//         let ret: any = {};
//         let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);

//         let customer = await this.getCustomer(allDataCollection, customerId);
//         //let retArray: BankingAccountV2[] = [];
//         if (customer?.banking?.payees == null) {
//             return null;
//         } else {
//             let payees = customer?.banking?.payees.filter((x: BankingPayeeDetailV2) => {
//                 if (x.payeeId == payeeId)
//                     return x;
//             })
//             if (payees?.length > 0)
//                 ret.data = payees[0];
//             else
//                 return null;
//         }

//         let l: Links = {
//             self: ""
//         }
//         let m: Meta= {}
//         ret.links = l;
//         ret.meta = m;
//         return ret;
//     }

//     async getAllBankingProducts(queryParameters: any): Promise<any> {
//         let ret: any = {};
//         let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
//         let allPlans: any = await this.getProducts(allData, undefined);

//         let retArray: any[] = [];
//         if (allPlans == null) {
//             ret.data = { products: retArray };
//         } else {
//             await allPlans.forEach((p: BankingProductDetailV4) => {
//                 let product: BankingProductV4 = {
//                     brand: p.brand,
//                     description: p.description,
//                     isTailored: p.isTailored,
//                     lastUpdated: p.lastUpdated,
//                     name: p.name,
//                     productCategory: p.productCategory,
//                     productId: p.productId
//                 } ;
//                 if (p.additionalInformation != null ) product.additionalInformation = p.additionalInformation;
//                 if (p.effectiveFrom != null ) product.effectiveFrom = p.effectiveFrom;
//                 if (p.effectiveTo != null ) product.effectiveFrom = p.effectiveTo;
//                 if (p.brandName != null ) product.brandName = p.brandName;
//                 if (p.applicationUri != null) product.applicationUri = p.applicationUri;
//                 if (p.cardArt != null) product.cardArt = p.cardArt;
//                 retArray.push(product);      
//             });       
//             ret.data = { products: retArray };
//         }

//         let l: LinksPaginated = {
//             self: ""
//         }
//         let m: MetaPaginated = {
//             totalPages: 0,
//             totalRecords: 0
//         }
//         ret.links = l;
//         ret.meta = m;
//         return ret;
//     }

//     async getBankingProductDetails(productId: string): Promise<any> {
//         let ret: any = {};
//         let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
//         // const query = { productId: productId };
//         let product: any = await this.getProducts(allData, productId);

//         if (product == null || product.length == 0)
//             return null;

//         ret.data = product[0];
//         let l: Links = {
//             self: ""
//         }
//         let m: Meta = {

//         }
//         ret.links = l;
//         ret.meta = m;
//         return ret;
//     }

//     async getProducts(allDataCollection: mongoDB.Collection, productId: string | undefined): Promise<any> {
//         let allData = await allDataCollection.findOne();
//         let allProducts = null;
//         if (allData?.holders != null)
//             allProducts = allData?.holders[0]?.holder?.unauthenticated?.banking?.products;
//         if (productId != null) {
//             allProducts = allData?.holders[0]?.holder?.unauthenticated?.banking?.products.filter((x: any) => {
//                 if (x.productId == productId)
//                     return x;
//             })
//         } 
//         return allProducts;
//     }

//     async getPayeeList(allDataCollection: mongoDB.Collection, productId: string | undefined): Promise<any> {
//         let allData = await allDataCollection.findOne();
//         let allProducts = null;
//         if (allData?.holders != null)
//             allProducts = allData?.holders[0]?.holder?.unauthenticated?.banking?.products;
//         if (productId != null) {
//             allProducts = allData?.holders[0]?.holder?.unauthenticated?.banking?.products.filter((x: any) => {
//                 if (x.productId == productId)
//                     return x;
//             })
//         } 
//         return allProducts;
//     }    

//     async loadCustomer(customer: any): Promise<boolean> {
//         if (customer == null) return false;
//         let customers: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
//         let ret = await customers.insertOne(customer);
//         return ret.insertedId != null

//     }

//     async getCustomer(allDataCollection: mongoDB.Collection, customerId: string): Promise<any> {
//         let allData = await allDataCollection.findOne();
//         if (allData?.holders != undefined) {
//             let allCustomers = allData?.holders[0]?.holder?.authenticated?.customers;
//             let cust = allCustomers?.find(((x: any) => x.customerId == customerId));
//             return cust;       
//         } else {
//             return null;
//         }
//     }
//     async connectDatabase() {
//         try {
//             await this.client.connect();
//             this.dsbData = this.client.db(this.dsbName);
//         }
//         catch (e) {
//             console.log(`Failed to connet to MongoDB${JSON.stringify(e)}`)
//         }

//     }

//     async disconnectDatabase() {
//         try {
//             await this.client.close();
//         }
//         catch (e) {
//             console.log(`Failed to connet to MongoDB${JSON.stringify(e)}`)
//         }
//     }

//     async getCollections(): Promise<string[]> {
//         let retList: string[] = [];
//         let collections = await this.dsbData.collections();
//         let name = this.dsbData.databaseName;
//         let cnt = await collections.length;
//         collections.forEach(c => {
//             retList.push(c.collectionName)
//         })
//         return retList;
//     }


// }