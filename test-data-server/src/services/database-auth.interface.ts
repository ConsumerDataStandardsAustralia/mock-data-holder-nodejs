import { CustomerModel } from "../models/login";

export interface IAuthData {
    
    getUserForLoginId(loginId: string, userType: string): Promise<string| undefined>;

    getLoginInformation(sector?: string, loginId?: string): Promise<CustomerModel[] | undefined>;

}