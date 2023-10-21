import { CustomerModel } from "../models/login";

export interface IBankingData {
    connectDatabase() : Promise<void>;
    disconnectDatabase() : Promise<void>;
    getCollections(): Promise<string[]>;

    loadCustomer(customer: any): Promise<boolean>;

    getBankingProductDetails(productId: string): Promise<any>;

    getAllBankingProducts(queryParameters: any): Promise<any>;

}