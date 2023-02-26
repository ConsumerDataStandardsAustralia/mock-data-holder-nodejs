export interface IDatabase {
    connectDatabase() : Promise<void>;
    disconnectDatabase() : Promise<void>;
    getCollections(): Promise<string[]>;

    loadCustomer(customer: any): Promise<boolean>;

    getEnergyAccounts(customerId: string): Promise<any>;

    getServicePoints(customerId: string): Promise<any>;

    getEnergyAccountDetails(customerId: string, accountId: string): Promise<any>;

    getInvoicesForAccount(customerId: string, accountId: string): Promise<any>;

    getInvoicesForMultipleAccounts(customerId: string, accountIds: string[]): Promise<any>;

    getUsageForMultipleServicePoints(customerId: string, severvicePointIds: string[]): Promise<any> 

    getDerForMultipleServicePoints(customerId: string, severvicePointIds: string[]): Promise<any> 

    getBalanceForAccount(customerId: string, accountId: string): Promise<any>;

    getBalancesForMultipleAccount(customerId: string, accountIds: string[]): Promise<any>;

    getServicePointDetails(customerId: string, servicePointId: string): Promise<any>;

    getUsageForServicePoint(customerId: string, servicePointId: string): Promise<any>;

    getDerForServicePoint(customerId: string, servicePointId: string): Promise<any>;

    getCustomerDetails(customerId: string): Promise<any>;

    getTransactionsForAccount(customerId: string, accountId: string): Promise<any>;

    getBillingForMultipleAccounts(customerId: string, accountIds: string[]): Promise<any>;

    getConcessionsForAccount(customerId: string, accountId: string): Promise<any>;

    getPaymentSchedulesForAccount(customerId: string, accountId: string): Promise<any>;

    getEnergyPlanDetails(planId: string): Promise<any>;
    
    getEnergyAllPlans(): Promise<any>;

    getBulkInvoicesForUser(customerId: string): Promise<any>;

    getBulkBilllingForUser(customerId: string): Promise<any>;

    getBulkBalancesForUser(customerId: string): Promise<any>;

    getBulkUsageForUser(customerId: string): Promise<any>;

    getBulkDerForUser(customerId: string): Promise<any>;
}