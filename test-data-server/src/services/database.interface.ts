import { EnergyAccountV2, EnergyServicePoint, EnergyAccountDetailV3, EnergyInvoice, EnergyUsageRead, EnergyDerRecord, EnergyServicePointDetail, EnergyBillingTransactionV3, EnergyConcession, EnergyPaymentSchedule, EnergyPlanDetailV2, EnergyPlan } from "consumer-data-standards/energy";
import { CustomerModel } from "../models/login";
import { IBankingData } from "./database-banking.interface";
import { IEnergyData } from "./database-energy.interface";
import { IAuthData } from "./database-auth.interface";

export interface IDatabase extends IEnergyData, IBankingData, IAuthData {
    
    connectDatabase() : Promise<void>;
    disconnectDatabase() : Promise<void>;
    getCollections(): Promise<string[]>;
}