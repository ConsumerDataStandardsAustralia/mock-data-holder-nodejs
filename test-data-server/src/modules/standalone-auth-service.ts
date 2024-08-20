
import { DsbCdrUser } from "../models/user";
import jwtDecode from "jwt-decode";
import { IDatabase } from "../services/database.interface";
import { IAuthService } from "./auth-service.interface";


export class StandAloneAuthService implements IAuthService {
    authUser: DsbCdrUser | undefined;
    
    allScopes: string = 'openid profile energy:electricity.servicepoints.basic:read energy:electricity.servicepoints.detail:read energy:electricity.usage:read energy:electricity.der:read energy:accounts.basic:read energy:accounts.detail:read energy:accounts.paymentschedule:read energy:accounts.concessions:read energy:billing:read openid profile bank:accounts.basic:read bank:accounts.detail:read bank:transactions:read bank:regular_payments:read bank:payees:read openid profile common:customer.basic:read common:customer.detail:read cdr:registration'
    private dbService: IDatabase;

    constructor(dbService: IDatabase) {
        this.dbService = dbService;
    }

    async initAuthService(): Promise<boolean> {       
        return true
    }
    
    public async verifyAccessToken(token?: string): Promise<boolean> {
        this.authUser = await this.buildUser(token);
        return true;
    }

    private async buildUser(token?: string) : Promise<DsbCdrUser | undefined> {
        // First the JWT access token must be decoded and the signature verified
        
        try {
                
            // Since this is running without authorisation a user is set in the environment file
            let loginId = process.env.LOGIN_ID
            console.log(`Login id is: ${loginId}`)
            let customerId = await this.dbService.getUserForLoginId(loginId as string, 'person');
            console.log(`CustomerId id is: ${customerId}`)
            if (customerId == undefined)
               return undefined;
            let energyAccounts: string[] = [];
            let bankingAccounts: string[] = [];

            let allEnergyAccounts = await this.dbService.getAllEnergyAccountsForCustomer(customerId);
            let allBankingAccounts = await this.dbService.getAllBankingAccountsForCustomer(customerId);

            allEnergyAccounts?.forEach(acc => {
                energyAccounts.push(acc.accountId);
            });

            allBankingAccounts?.forEach(acc => {
                bankingAccounts.push(acc.accountId);
            });
            this.authUser  = {
                loginId : process.env.LOGIN_ID,
                customerId: customerId,
                encodeUserId: "",
                encodedAccounts: [],
                accountsEnergy: energyAccounts,
                accountsBanking: bankingAccounts,
                scopes_supported: this.getScopes(token)
            }
            this.authUser.energyServicePoints = await this.dbService.getServicePointsForCustomer(customerId) as string[];
            this.authUser.bankingPayees = await this.dbService.getPayeesForCustomer(customerId)  as string[];
            return this.authUser;
        } catch(ex) {
            console.log(JSON.stringify(ex))
            return undefined;
        }
    }

    private getScopes(token?: string): string[] {
        let scopes: string [] = [];   
        if (token != null) {
            let decoded: any = jwtDecode(token);
            scopes = decoded?.scope
        } else {
            scopes = this.allScopes.split(' ')
        }      
        return scopes;
    }
}