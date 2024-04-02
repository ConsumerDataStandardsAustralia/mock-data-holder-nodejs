import { IBankingData } from "./database-banking.interface";
import { IEnergyData } from "./database-energy.interface";

export interface IDatabase extends IEnergyData {
    connectDatabase() : Promise<void>;
    disconnectDatabase() : Promise<void>;
    getCollections(): Promise<string[]>;
}