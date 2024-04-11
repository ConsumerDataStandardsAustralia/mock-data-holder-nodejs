// import { AccountModel, CustomerModel } from "../models/login";
// import { IBankingData } from "./database-banking.interface";
// import { Service } from "typedi";
// import * as mongoDB from "mongodb";

// @Service()
// export class BankingDataMongo implements IBankingData {

//     public collections: mongoDB.Collection[] = [];
//     private client: mongoDB.MongoClient;
//     private dsbData: mongoDB.Db;

//     constructor(connString: string, dbName: string) {
//         this.client = new mongoDB.MongoClient(connString, { monitorCommands: true });
//         this.dsbData = this.client.db(dbName);
//     }
//     getAccounts(customerId: string, queryParameters: any): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getAccountDetail(customerId: string, accountId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getTransationsForAccount(customerId: string, accountId: string, queryParameters: any): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getTransactionDetail(customerId: string, transactionId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getBulkBalances(customerId: string, queryParameters: any): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getAccountBalance(customerId: string, accountId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getBalancesForSpecificAccounts(customerId: string, accountIds: string[], queryParameters: any): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getDirectDebitsForAccount(customerId: string, accountId: string, queryParameters: any): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getDirectDebitsForAccountList(customerId: string, accountIds: string[], queryParameters: any): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getBulkDirectDebits(customerId: string, queryParameters: any): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getScheduledPaymentsForAccount(customerId: string, accountId: string, queryParameters: any): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getScheduledPaymentsForAccountList(customerId: string, accountIds: string[], queryParameters: any): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getBulkScheduledPayments(customerId: string, queryParameters: any): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getPayees(customerId: string, queryParameters: any): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getPayeeDetail(customerId: string, payeeId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getAllBankingProducts(): Promise<any> {
//         throw new Error("Method not implemented.");
//     }

//     async loadCustomer(customer: any): Promise<boolean> {
//         if (customer == null) return false;
//         let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
//         let ret = await customers.insertOne(customer);
//         return ret.insertedId != null

//     }

//     async connectDatabase() {
//         try {
//             await this.client.connect();
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


//     async getBankingProductDetails(productId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }

// }