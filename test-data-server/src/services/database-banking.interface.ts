import { CustomerModel } from "../models/login";

export interface IBankingData {
    connectDatabase() : Promise<void>;
    disconnectDatabase() : Promise<void>;
    getCollections(): Promise<string[]>;

    loadCustomer(customer: any): Promise<boolean>;

    getBankingProductDetails(productId: string): Promise<any>;

    getAllBankingProducts(queryParameters: any): Promise<any>;

    getAccounts(customerId: string, queryParameters: any): Promise<any>;

    getAccountDetail(customerId: string, accountId: string): Promise<any>;

    getTransationsForAccount(customerId: string, accountId: string, queryParameters: any): Promise<any>;

    getTransactionDetail(customerId: string, transactionId: string): Promise<any>;

    getBulkBalances(customerId: string, queryParameters: any): Promise<any>;

    getAccountBalance(customerId: string, accountId: string): Promise<any>;

    getBalancesForSpecificAccounts(customerId: string, accountId: string, queryParameters: any): Promise<any>;

    getDirectDebitsForAccount(customerId: string, accountId: string, queryParameters: any): Promise<any>;

    getDirectDebitsForAccountList(customerId: string, accountIds: string[], queryParameters: any): Promise<any>;

    getBulkDirectDebits(customerId: string, queryParameters: any): Promise<any>;

    getScheduledPaymentsForAccount(customerId: string, accountId: string, queryParameters: any): Promise<any>;

    getScheduledPaymentsForAccountList(customerId: string, accountIds: string[], queryParameters: any): Promise<any>;

    getBulkScheduledPayments(customerId: string, queryParameters: any): Promise<any>;

    getPayees(customerId: string, queryParameters: any): Promise<any>;

    getPayeeDetail(customerId: string, payeeId: string): Promise<any>;

}