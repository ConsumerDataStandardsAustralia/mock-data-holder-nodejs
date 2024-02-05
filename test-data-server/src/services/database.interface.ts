import { CustomerModel } from "../models/login";

export interface IDatabase {
    connectDatabase() : Promise<void>;
    disconnectDatabase() : Promise<void>;
    getCollections(): Promise<string[]>;

    loadCustomer(customer: any): Promise<boolean>;

    getEnergyAccounts(customerId: string, accountIds: string[], query: any): Promise<any>;

    getServicePoints(customerId: string): Promise<any>;

    getEnergyAccountDetails(customerId: string, accountId: string): Promise<any>;

    getInvoicesForAccount(customerId: string, accountId: string, query: any): Promise<any>;

    getInvoicesForMultipleAccounts(customerId: string, accountIds: string[], query: any): Promise<any>;

    getUsageForMultipleServicePoints(customerId: string, severvicePointIds: string[], query: any): Promise<any> 

    getDerForMultipleServicePoints(customerId: string, severvicePointIds: string[]): Promise<any> 

    getBalanceForAccount(customerId: string, accountId: string): Promise<any>;

    getBalancesForMultipleAccount(customerId: string, accountIds: string[]): Promise<any>;

    getServicePointDetails(customerId: string, servicePointId: string): Promise<any>;

    getUsageForServicePoint(customerId: string, servicePointId: string, query: any): Promise<any>;

    getDerForServicePoint(customerId: string, servicePointId: string): Promise<any>;

    getCustomerDetails(customerId: string): Promise<any>;

    getTransactionsForAccount(customerId: string, accountId: string): Promise<any>;

    getBillingForMultipleAccounts(customerId: string, accountIds: string[], query: any): Promise<any>;

    getConcessionsForAccount(customerId: string, accountId: string): Promise<any>;

    getPaymentSchedulesForAccount(customerId: string, accountId: string): Promise<any>;

    getEnergyPlanDetails(planId: string): Promise<any>;
    
    getEnergyAllPlans(query: any): Promise<any>;

    getBulkInvoicesForUser(customerId: string, query: any): Promise<any>;

    getBulkBilllingForUser(customerId: string, query: any): Promise<any>;

    getBulkBalancesForUser(customerId: string): Promise<any>;

    getBulkUsageForUser(customerId: string, query: any): Promise<any>;

    getBulkDerForUser(customerId: string): Promise<any>;

    getUserForLoginId(loginId: string, userType: string): Promise<string| undefined>;

    getLoginInformation(sector: string): Promise<CustomerModel[] | undefined>;

    getServicePointsForCustomer(customerId: string): Promise<string[] | undefined>
}