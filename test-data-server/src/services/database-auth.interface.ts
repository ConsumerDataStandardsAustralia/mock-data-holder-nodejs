import { CustomerModel } from "../models/login";

export interface IAuthData {
    
    connectDatabase() : Promise<void>;
    disconnectDatabase() : Promise<void>;
    getCollections(): Promise<string[]>;

    getUserForLoginId(loginId: string, userType: string): Promise<string| undefined>;

    getLoginInformation(sector?: string, loginId?: string): Promise<CustomerModel[] | undefined>;

}