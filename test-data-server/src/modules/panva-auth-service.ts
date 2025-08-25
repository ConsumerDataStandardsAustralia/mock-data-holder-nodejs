
import { DsbCdrUser } from "../models/user";
import { JwkKey } from "../models/jwt-key";
import axios, { Axios, AxiosRequestConfig, RawAxiosRequestHeaders } from "axios";
import { IDatabase } from "../services/database.interface";

import { IAuthService } from "./auth-service.interface";
import { unescape } from "querystring";
import { CdrArrangement } from "./cdr-arrangement.model";
import { Request} from 'express';
import { Introspection } from "../models/introspection";


export class PanvaAuthService implements IAuthService {

    private introspection_endpoint: string | undefined;
    private jwkKeys: JwkKey[] | undefined;
    private tlsThumPrint: string | undefined;
    private jwtEncodingAlgorithm: string;
    private issuer: string | undefined;
    private jwks_uri: string | undefined;
    private token_endpoint: string | undefined;

    private dbService: IDatabase;

    constructor(dbService: IDatabase) {
        this.dbService = dbService;
        this.jwtEncodingAlgorithm = 'ES256';
    }

    public getUser(req: Request): DsbCdrUser | undefined {
            return req.session.cdrUser;

    }

    public async setUser(req: Request, accessTokenObject: Introspection): Promise<DsbCdrUser | undefined> {
        let accessToken = req.headers?.authorization;
        // In NO_AUTH_SERVER=false an accessToken may still be provided
        if (accessToken == null) {
            return undefined;
        }
              
        // validate access token via introspective endpoint
        const arrangementResponse: any = await this.getArrangement(accessTokenObject?.cdr_arrangement_id as string) ;
        const arrangement: CdrArrangement | null = arrangementResponse?.data
        let currentUser: DsbCdrUser|undefined = await this.buildUser(arrangement, accessTokenObject)

        req.session.cdrUser = currentUser;
        return currentUser;
    }

    public async initAuthService(): Promise<boolean> {
        try {
            console.log('Initialise auth service..');
            this.tlsThumPrint = this.calculateTLSThumbprint();
            const url = `${process.env.AUTH_SERVER_URL}/.well-known/openid-configuration`
            console.log(`Auth server url: ${url}`);
            const response = await axios.get(url)
            if (!(response.status == 200)) {
                console.log('Auth server discovery failed.');
                return false;
            }
            else {
                console.log(`Auth server discovery complete. ${JSON.stringify(response.data)}`);
                // set the various endpoints
                this.token_endpoint = response.data?.token_endpoint;
                this.introspection_endpoint = response.data?.introspection_endpoint;
                this.jwks_uri = response.data?.jwks_uri;
                this.issuer = response.data?.issuer;
                return true;
            }
        } catch (error: any) {
            console.log('ERROR: ', error.message);
            console.log('ERROR DETAIL', error?.response?.data);
            return false;
        }
    }

    public async getArrangement(id: string): Promise<CdrArrangement|null> {
        try {
            let authHeader = this.buildBasicAuthHeader();
            let config: AxiosRequestConfig = {
                headers: { 'Authorization': `${authHeader}` }
            };
            let urlStr = `${process.env.AUTH_SERVER_URL}/arrangement/${id}`
            const arrangement: CdrArrangement = await axios.get(urlStr, config)
            //let arrangement: any = await this.getArrangement(response?.data?.cdr_arrangement_id);
            //await this.buildUser(arrangement?.data);
            // response.data will be a CdrArrangement object as defined in dsb-panva-oidc--provider
            return arrangement;
        } catch (error: any) {
            console.log('ERROR: ', error.message);
            console.log('ERROR DETAIL', error?.response?.data);
            return null;
        }
    }

    // Call the Idp introspection endpointy and returns the decoded access token OR n
    public async verifyAccessToken(token: string): Promise<Introspection|null> {
        try {
            // no introspective endpoint exists
            if (this.introspection_endpoint == undefined)
                return null;
            let authHeader = this.buildBasicAuthHeader();
            let hdrs = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `${authHeader}`
            } as RawAxiosRequestHeaders;
            let config: AxiosRequestConfig = {
                headers: hdrs,
                method: 'POST'
            }
            console.log(`Token reponse is ${token}`)
            let tokeToBeValidated = token.split(' ')[1];
            const postBody: any = {
                token: tokeToBeValidated
            }
            console.log(`Token to be validated is ${JSON.stringify(postBody)}`)
            const response = await axios.post(this.introspection_endpoint, postBody, config)
            if (!(response.status == 200)) {
                return null;
            }
            else {
                return response?.data as Introspection;
            }
        } catch (error: any) {
            console.log('ERROR: ', error.message);
            console.log('ERROR DETAIL', error?.response?.data);
            return null;
        }
    }

    // This header is used for introspection calls, using Basic Auth "client_id:secret"
    private buildBasicAuthHeader(): string {
        let basic = 'Basic ';
        console.log(`Building auth string from clientId: ${process.env.CLIENT_ID} and clientSecret: ${process.env.CLIENT_SECRET}`)
        let authString = `${unescape(process.env.CLIENT_ID ?? '')}:${unescape(process.env.CLIENT_SECRET ?? '')}`;
        let authString64 = Buffer.from(authString).toString('base64url');
        console.log(`Auth string: ${basic}${authString64}`)
        return `${basic}${authString64}`

    }

    private async buildUser(arrangement: CdrArrangement|null, accessTokenObject: Introspection|null): Promise<DsbCdrUser| undefined> {
        try {
            if (arrangement == null)
                return undefined;
            let loginId = arrangement.loginId?.split('_')[0];
            let customerId = await this.dbService.getUserForLoginId(loginId, 'person');
            if (customerId == undefined)
                return undefined;
            let user: DsbCdrUser = {
                loginId: loginId,
                customerId: customerId,
                accountsEnergy: arrangement?.consentedEnergyAccounts?.map(x => x.AccountId),
                accountsBanking: arrangement?.consentedBankingAccounts?.map(x => x.AccountId),
                scopes_supported: accessTokenObject?.scope?.split(' ')
            }
            user.energyServicePoints = await this.dbService.getServicePointsForCustomer(customerId) as string[];
            user.bankingPayees = await this.dbService.getPayeesForCustomer(customerId) as string[];
            return user;
        } catch (ex) {
            console.log(JSON.stringify(ex))
            return undefined;
        }
    }

    private calculateTLSThumbprint(): string {
        // TODO read the TLS certificate and calculate the thumbprint, then store in this.tlsThumbprint   
        return '';
    }
}