
import { DsbCdrUser } from "../models/user";
import jwtDecode from "jwt-decode";
import { IDatabase } from "../services/database.interface";
import { IAuthService } from "./auth-service.interface";
import { Request } from "express";
import { Introspection } from "../models/introspection";
import { CdrArrangement } from "./cdr-arrangement.model";


export class StandAloneAuthService implements IAuthService {
    authUser: DsbCdrUser | undefined;
    clientId: string;
    clientSecret: string; 
    allScopes: string = 'openid profile energy:electricity.servicepoints.basic:read energy:electricity.servicepoints.detail:read energy:electricity.usage:read energy:electricity.der:read energy:accounts.basic:read energy:accounts.detail:read energy:accounts.paymentschedule:read energy:accounts.concessions:read energy:billing:read openid profile bank:accounts.basic:read bank:accounts.detail:read bank:transactions:read bank:regular_payments:read bank:payees:read openid profile common:customer.basic:read common:customer.detail:read cdr:registration'
    private dbService: IDatabase;
    defaultAccessToken: string|undefined;

    constructor(dbService: IDatabase, defaultToken: string|undefined) {
        this.dbService = dbService;
        this.defaultAccessToken = defaultToken;
        this.clientId = "";
        this.clientSecret = "";
        this.defaultAccessToken = process.env.DEFAULT_ACCESS_TOKEN;

    }

    private isArrayOfStrings(value: string|string[]) : boolean {
        return Array.isArray(value) && value.every(element => typeof element === 'string');
    }

    public async verifyAccessToken(req?: Request): Promise<Introspection | null> {
        try {
        let token = req?.headers?.authorization;
        if (token == null)
            token =  this.defaultAccessToken as string;
        let decoded = jwtDecode(token) as any;

        // This will handle an array of strings as scops and a space seperated string as scopes
        let introspectionScopes : string = '';
        if (this.isArrayOfStrings(decoded?.scope) == true) {
            introspectionScopes = decoded?.scope.join(" ");
        } else {
            introspectionScopes = decoded?.scope;
        }

        let introspection: Introspection = {
            cdr_arrangement_id: decoded?.cdr_arrangement_id,
            client_id: decoded?.client_id,
            scope: introspectionScopes,
            exp: decoded?.exp,
            iat: decoded?.iat,
            iss: decoded?.iss,
            active: false,
            token_type: "access_token",
            sub: decoded?.sub
        }
        return introspection;
        } catch (ex) {
            console.log(`Access token validation error: ${JSON.stringify(ex)}`)
            return null;
        }

    }

    public getUser(req: Request): DsbCdrUser | undefined {
        return req.session.cdrUser;
    }

    public async setUser(req: Request, introspectionObject: Introspection): Promise<DsbCdrUser | undefined> {
        try {
            let loginId = introspectionObject?.sub;
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

            let authUserScopes = introspectionObject?.scope as any
            this.authUser = {
                loginId: introspectionObject?.sub,
                customerId: customerId,
                accountsEnergy: energyAccounts,
                accountsBanking: bankingAccounts,
                scopes_supported:  authUserScopes as string[]
            }
            this.authUser.energyServicePoints = await this.dbService.getServicePointsForCustomer(customerId) as string[];
            this.authUser.bankingPayees = await this.dbService.getPayeesForCustomer(customerId) as string[];
            req.session.cdrUser = this.authUser;
            return this.authUser;
        } catch (ex) {
            console.log(JSON.stringify(ex))
            return undefined;
        }
    }

    async initAuthService(): Promise<boolean> {
        return true
    }

    public async buildUser(arrangement: CdrArrangement | null): Promise<DsbCdrUser | undefined> {
        try {
            if (arrangement == null)
                return undefined;
            let loginId = arrangement.loginId;
            let customerId = await this.dbService.getUserForLoginId(loginId, 'person');
            if (customerId == undefined)
                return undefined;
            let user: DsbCdrUser = {
                loginId: loginId,
                customerId: customerId,
                accountsEnergy: arrangement?.consentedEnergyAccounts?.map(x => x.AccountId),
                accountsBanking: arrangement?.consentedBankingAccounts?.map(x => x.AccountId),
                scopes_supported: arrangement?.scopes?.split(' ')
            }
            user.energyServicePoints = await this.dbService.getServicePointsForCustomer(customerId) as string[];
            user.bankingPayees = await this.dbService.getPayeesForCustomer(customerId) as string[];
            return user;
        } catch (ex) {
            console.log(JSON.stringify(ex))
            return undefined;
        }
    }

    private getScopes(token?: string): string[] {
        let scopes: string[] = [];
        try {

            if (token != null) {
                let decoded: any = jwtDecode(token);
                scopes = decoded?.scope
            } else {
                scopes = this.allScopes.split(' ')
            }
            return scopes;
        } catch (ex) {
            console.log(JSON.stringify(ex))
            return scopes;
        }
    }
}