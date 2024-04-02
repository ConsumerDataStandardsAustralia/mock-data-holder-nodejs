// import { IDatabase } from "./database.interface";
// import * as mongoDB from "mongodb";

// export class SingleData implements IDatabase {

//     public collections: mongoDB.Collection[] = [];
//     private client: mongoDB.MongoClient;
//     private dsbData: mongoDB.Db;
//     private dsbName: string;

//     constructor(connString: string, dbName: string) {
//         this.client = new mongoDB.MongoClient(connString, { monitorCommands: true });
//         this.dsbName = dbName;
//         this.dsbData = this.client.db(dbName);
//     }
//     connectDatabase(): Promise<void> {
//         throw new Error("Method not implemented.");
//     }
//     disconnectDatabase(): Promise<void> {
//         throw new Error("Method not implemented.");
//     }
//     getCollections(): Promise<string[]> {
//         throw new Error("Method not implemented.");
//     }
//     loadCustomer(customer: any): Promise<boolean> {
//         throw new Error("Method not implemented.");
//     }
//     getEnergyAccounts(customerId: string, accountIds: string[]): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getServicePoints(customerId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getEnergyAccountDetails(customerId: string, accountId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getInvoicesForAccount(customerId: string, accountId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getInvoicesForMultipleAccounts(customerId: string, accountIds: string[]): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getUsageForMultipleServicePoints(customerId: string, severvicePointIds: string[]): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getDerForMultipleServicePoints(customerId: string, severvicePointIds: string[]): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getBalanceForAccount(customerId: string, accountId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getBalancesForMultipleAccount(customerId: string, accountIds: string[]): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getServicePointDetails(customerId: string, servicePointId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getUsageForServicePoint(customerId: string, servicePointId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getDerForServicePoint(customerId: string, servicePointId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getCustomerDetails(customerId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getTransactionsForAccount(customerId: string, accountId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getBillingForMultipleAccounts(customerId: string, accountIds: string[]): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getConcessionsForAccount(customerId: string, accountId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getPaymentSchedulesForAccount(customerId: string, accountId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getEnergyPlanDetails(planId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getEnergyAllPlans(): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getBulkInvoicesForUser(customerId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getBulkBilllingForUser(customerId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getBulkBalancesForUser(customerId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getBulkUsageForUser(customerId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getBulkDerForUser(customerId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getBankingProductDetails(productId: string): Promise<any> {
//         throw new Error("Method not implemented.");
//     }
//     getAllBankingProducts(queryParameters: any): Promise<any> {
//         throw new Error("Method not implemented.");
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
//     getTransactionDetail(customerId: string, accountId: string, transactionId: string): Promise<any> {
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

// }