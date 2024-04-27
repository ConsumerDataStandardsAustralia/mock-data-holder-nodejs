import { EnergyAccountV2, EnergyServicePoint, EnergyAccountDetailV3, EnergyInvoice, EnergyUsageRead, EnergyDerRecord, 
    EnergyServicePointDetail, EnergyBillingTransactionV2, EnergyConcession, EnergyPaymentSchedule, 
    EnergyPlanDetailV2, EnergyPlan } from "consumer-data-standards/energy";
import { CustomerModel } from "../models/login";

export interface IEnergyData {

    getEnergyAccounts(customerId: string, accountIds: string[], query: any): Promise<EnergyAccountV2[]>;

    getServicePoints(customerId: string): Promise<EnergyServicePoint[]>;

    getEnergyAccountDetails(customerId: string, accountId: string): Promise<EnergyAccountDetailV3 | undefined>;
  
    getInvoicesForAccount(customerId: string, accountId: string, query: any): Promise<EnergyInvoice[]>;

    getInvoicesForMultipleAccounts(customerId: string, accountIds: string[], query: any): Promise<EnergyInvoice[]>;

    getUsageForMultipleServicePoints(customerId: string, severvicePointIds: string[], query: any): Promise<EnergyUsageRead[]> 

    getDerForMultipleServicePoints(customerId: string, severvicePointIds: string[]): Promise<EnergyDerRecord[]> 

    getBalanceForAccount(customerId: string, accountId: string): Promise<any>;

    getBalancesForMultipleAccount(customerId: string, accountIds: string[]): Promise<any[]>;

    getServicePointDetails(customerId: string, servicePointId: string): Promise<EnergyServicePointDetail>;

    getUsageForServicePoint(customerId: string, servicePointId: string, query: any): Promise<EnergyUsageRead[]>;

    getDerForServicePoint(customerId: string, servicePointId: string): Promise<EnergyDerRecord | undefined>;

    getCustomerDetails(customerId: string): Promise<any>;

    getBillingForAccount(customerId: string, accountId: string, query: any): Promise<EnergyBillingTransactionV2[]>;

    getBillingForMultipleAccounts(customerId: string, accountIds: string[], query: any): Promise<EnergyBillingTransactionV2[]>;

    getConcessionsForAccount(customerId: string, accountId: string): Promise<EnergyConcession[] | undefined>;

    getPaymentSchedulesForAccount(customerId: string, accountId: string): Promise<EnergyPaymentSchedule[]>;

    getEnergyPlanDetails(planId: string): Promise<EnergyPlanDetailV2 | null>;
    
    getEnergyAllPlans(query: any): Promise<EnergyPlan[]>;

    getBulkInvoicesForUser(customerId: string, query: any): Promise<EnergyInvoice[]>;

    getBulkBilllingForUser(customerId: string, query: any): Promise<EnergyBillingTransactionV2[]>;

    getBulkBalancesForUser(customerId: string): Promise<any[]>;

    getBulkUsageForUser(customerId: string, query: any): Promise<EnergyUsageRead[]>;

    getBulkDerForUser(customerId: string): Promise<EnergyDerRecord[]>;

    getUserForLoginId(loginId: string, userType: string): Promise<string| undefined>;

    getLoginInformation(sector?: string, loginId?: string): Promise<CustomerModel[] | undefined>;

    getServicePointsForCustomer(customerId: string): Promise<string[] | undefined>
}