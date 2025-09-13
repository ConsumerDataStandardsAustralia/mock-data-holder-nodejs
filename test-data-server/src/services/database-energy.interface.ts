import { EnergyAccountV2, EnergyServicePoint, EnergyAccountDetailV4, EnergyInvoice, EnergyUsageRead, EnergyDerRecord, 
    EnergyServicePointDetail, EnergyBillingTransactionV2, EnergyConcession, EnergyPaymentSchedule, EnergyBillingTransactionV3,
    EnergyPlanDetailV3, EnergyPlan, EnergyServicePointDetailV2 } from "consumer-data-standards/energy";
import { CustomerModel } from "../models/login";

export interface IEnergyData {

    getEnergyAccounts(customerId: string, accountIds: string[], query: any, version?: number): Promise<EnergyAccountV2[]>;

    getServicePoints(customerId: string, version?: number): Promise<EnergyServicePoint[]>;

    getEnergyAccountDetails(customerId: string, accountId: string, version?: number): Promise<EnergyAccountDetailV4 | undefined>;
  
    getInvoicesForAccount(customerId: string, accountId: string, query: any, version?: number): Promise<EnergyInvoice[]>;

    getInvoicesForMultipleAccounts(customerId: string, accountIds: string[], query: any, version?: number): Promise<EnergyInvoice[]>;

    getUsageForMultipleServicePoints(customerId: string, severvicePointIds: string[], query: any, version?: number): Promise<EnergyUsageRead[]> 

    getDerForMultipleServicePoints(customerId: string, severvicePointIds: string[], version?: number): Promise<EnergyDerRecord[]> 

    getBalanceForAccount(customerId: string, accountId: string, version?: number): Promise<any>;

    getBalancesForMultipleAccount(customerId: string, accountIds: string[], version?: number): Promise<any[]>;

    getServicePointDetails(customerId: string, servicePointId: string, version?: number): Promise<EnergyServicePointDetail | EnergyServicePointDetailV2>;

    getUsageForServicePoint(customerId: string, servicePointId: string, query: any, version?: number): Promise<EnergyUsageRead[]>;

    getDerForServicePoint(customerId: string, servicePointId: string, version?: number): Promise<EnergyDerRecord | undefined>;

    getCustomerDetails(customerId: string, version?: number): Promise<any>;

    getBillingForAccount(customerId: string, accountId: string, query: any, version?: number): Promise<EnergyBillingTransactionV3[]>;

    getBillingForMultipleAccounts(customerId: string, accountIds: string[], query: any, version?: number): Promise<EnergyBillingTransactionV3[]>;

    getConcessionsForAccount(customerId: string, accountId: string, version?: number): Promise<EnergyConcession[] | undefined>;

    getPaymentSchedulesForAccount(customerId: string, accountId: string, version?: number): Promise<EnergyPaymentSchedule[]>;

    getEnergyPlanDetails(planId: string, version?: number): Promise<EnergyPlanDetailV3 | null>;
    
    getEnergyAllPlans(query: any, version?: number): Promise<EnergyPlan[]>;

    getBulkInvoicesForUser(customerId: string, query: any, version?: number): Promise<EnergyInvoice[]>;

    getBulkBilllingForUser(customerId: string, query: any, version?: number): Promise<EnergyBillingTransactionV3[]>;

    getBulkBalancesForUser(customerId: string, version?: number): Promise<any[]>;

    getBulkUsageForUser(customerId: string, query: any, version?: number): Promise<EnergyUsageRead[]>;

    getBulkDerForUser(customerId: string, version?: number): Promise<EnergyDerRecord[]>;

    // getUserForLoginId(loginId: string, userType: string, version?: number): Promise<string| undefined>;

    // getLoginInformation(sector?: string, loginId?: string): Promise<CustomerModel[] | undefined>;

    getServicePointsForCustomer(customerId: string, version?: number): Promise<string[] | undefined>

    // This method is used when the server is run without authentication and a user is set in the env file
    getAllEnergyAccountsForCustomer(customerId: string, version?: number) : Promise<EnergyAccountV2[]> | undefined;
}