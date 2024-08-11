import path from "path";
import { DsbCdrUser } from "../models/user";
import * as https from 'https'
import { readFileSync } from "fs";
import { Introspection } from "../models/introspection";
import { JwkKey } from "../models/jwt-key";
import axios, { Axios, AxiosRequestConfig } from "axios";
import jwtDecode from "jwt-decode";
import { IDatabase } from "../services/database.interface";
import { CryptoUtils } from "../utils/crypto-utils";
import { IAuthService } from "./auth-service.interface";
import { EnergyServicePoint } from "consumer-data-standards/energy";


export class StandAloneAuthService implements IAuthService {
    authUser: DsbCdrUser | undefined;

    private dbService: IDatabase;

    constructor(dbService: IDatabase) {
        this.dbService = dbService;
    }

    async initAuthService(): Promise<boolean> {       
        return true
    }
    
    public async verifyAccessToken(token: string): Promise<boolean> {
        this.authUser = await this.buildUser(token);
        return true;
    }

    private async buildUser(token: string) : Promise<DsbCdrUser | undefined> {
        // First the JWT access token must be decoded and the signature verified
        let decoded: any = jwtDecode(token);
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
                scopes_supported: decoded?.scope
            }
            this.authUser.energyServicePoints = await this.dbService.getServicePointsForCustomer(customerId) as string[];
            this.authUser.bankingPayees = await this.dbService.getPayeesForCustomer(customerId)  as string[];
            return this.authUser;
        } catch(ex) {
            console.log(JSON.stringify(ex))
            return undefined;
        }
    }
}