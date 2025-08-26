import path from "path";
import { DsbCdrUser } from "../models/user";
import * as https from 'https'
import { readFileSync } from "fs";
import { Introspection } from "../models/introspection";
import { JwkKey } from "../models/jwt-key";
import axios, { Axios, AxiosRequestConfig, RawAxiosRequestHeaders } from "axios";
import jwtDecode from "jwt-decode";
import { IDatabase } from "../services/database.interface";
import { CryptoUtils } from "../utils/crypto-utils";
import { IAuthService } from "./auth-service.interface";
import { EnergyServicePoint } from "consumer-data-standards/energy";
import { CdrArrangement } from "./cdr-arrangement.model";
import { Request } from "express";


export class AcccAuthService implements IAuthService {

    private token_endpoint: string | undefined;
    private introspection_endpoint: string | undefined;
    private introspection_endpoint_internal: string | undefined;
    private jwks_uri: string | undefined;
    private issuer: string | undefined;


    authUser: DsbCdrUser| undefined;
    private jwkKeys: JwkKey[] | undefined;
    private tlsThumPrint: string | undefined;
    private jwtEncodingAlgorithm: string;
    private algorithm = 'AES-256-CBC';
    // This key must be the same on the authorisation server
    private idPermanenceKey = process.env.IDPERMANENCEKEY;
    private iv = Buffer.alloc(16);
    private dbService: IDatabase;
    defaultAccessToken: string | undefined;
    clientId: string;
    clientSecret: string;

    constructor(dbService: IDatabase, clientId: string, clientSecret: string) {
        this.dbService = dbService;
        this.jwtEncodingAlgorithm = 'ES256';
        this.introspection_endpoint_internal = process.env.INTERNAL_INTROSPECTION;
        this.clientId = process.env.CLIENT_ID;
        this.clientSecret = process.env.CLIENT_SECRET;
    }

    getUser(req: Request): DsbCdrUser | undefined {
            return req.session.cdrUser;
    }
    async setUser(req: Request, accessTokenObject: Introspection | undefined): Promise<DsbCdrUser | undefined> {
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

    getArrangement(id: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    public async initAuthService(): Promise<boolean> {
        try {
            console.log('Initialise auth service..');
            const httpsAgent = this.buildHttpsAgent();
              let config : AxiosRequestConfig = {
                httpsAgent: httpsAgent,
              }

            this.tlsThumPrint = this.calculateTLSThumbprint();
            const url = path.join(process.env.AUTH_SERVER_URL as string, '.well-known/openid-configuration')
            console.log(`Auth server url: ${url}`);
            const response = await axios.get(url,  config)
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
            //return true;
        } catch (error: any) {
            console.log('ERROR: ', error.message);
            console.log('ERROR DETAIL', error?.response?.ata);   
            return false;
        }       
    }

    public async verifyAccessToken(req: Request): Promise<Introspection|null>{

        try {
            // no introspective endpoint exists
            if (this.introspection_endpoint_internal == undefined)
               return null;
            let token = req.headers?.authorisation as string;
            if (token == null)
                return null;
            let hdrs = {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    } ;
            this.authUser = await this.buildUser(token);
            const httpsAgent = this.buildHttpsAgent();
              let config : AxiosRequestConfig = {
                httpsAgent: httpsAgent,
                headers: hdrs
              }
            let postBody = this.buildIntrospecticePostBody(token);
            const response = await axios.post(this.introspection_endpoint_internal, postBody, config)
            if (!(response.status == 200)) {
                return null;
              }
            else {
                let intro: Introspection = response.data as Introspection;
                return intro
            }
        } catch (error: any) {
            console.log('ERROR: ', error.message);
            console.log('ERROR DETAIL', error?.response?.data);   
            return null;
        }



    }

    private buildHttpsAgent(): https.Agent {
        let httpsAgent = new https.Agent({
            ca: readFileSync(path.join(__dirname, '../security/mtls', process.env.CA_FILE as string))
           })
        return httpsAgent;
    }

    // private async buildUser(arrangement: CdrArrangement|null, accessTokenObject: Introspection|null): Promise<DsbCdrUser| undefined> {
    //     try {
    //         if (arrangement == null)
    //             return undefined;
    //         let loginId = arrangement.loginId?.split('_')[0];
    //         let customerId = await this.dbService.getUserForLoginId(loginId, 'person');
    //         if (customerId == undefined)
    //             return undefined;
    //         let user: DsbCdrUser = {
    //             loginId: loginId,
    //             customerId: customerId,
    //             accountsEnergy: arrangement?.consentedEnergyAccounts?.map(x => x.AccountId),
    //             accountsBanking: arrangement?.consentedBankingAccounts?.map(x => x.AccountId),
    //             scopes_supported: accessTokenObject?.scope?.split(' ')
    //         }
    //         user.energyServicePoints = await this.dbService.getServicePointsForCustomer(customerId) as string[];
    //         user.bankingPayees = await this.dbService.getPayeesForCustomer(customerId) as string[];
    //         return user;
    //     } catch (ex) {
    //         console.log(JSON.stringify(ex))
    //         return undefined;
    //     }
    // }

    private async buildUser(token?: string) : Promise<DsbCdrUser | null> {
        // First the JWT access token must be decoded and the signature verified
        if (token == null || token == "")
            return null;
        let decoded: any = jwtDecode(token);
        // decrypt the loginId, ie the sub claim from token:
        // Requires the software_id from the token.
        // The decryption key is the concatenated software_id and the private IdPermance key
        // The IdPermanence key (private key) is kwown to the DH and the Auth server
        try {
                
            let loginId = this.decryptLoginId(token);
            let customerId = await this.dbService.getUserForLoginId(loginId, 'person');
            if (customerId == undefined)
               return null;
            this.authUser  = {
                loginId : loginId,
                customerId: customerId,
                encodeUserId: decoded?.sub,
                encodedAccounts: decoded?.account_id,
                accountsEnergy: undefined,
                accountsBanking: undefined,
                scopes_supported: decoded?.scope
            }
            // Once the customerId (here: userId) has been the account ids can be decrypted.
            // The parameters here are the decrypted customerId from above and the software_id from the token
            // The IdPermanence key (private key) is kwown to the DH and the Auth server
            let accountIds: string[] = this.decryptAccountArray(token);
            this.authUser.accountsEnergy = accountIds;
            this.authUser.accountsBanking = accountIds;
            this.authUser.energyServicePoints = await this.dbService.getServicePointsForCustomer(customerId) as string[];
            this.authUser.bankingPayees = await this.dbService.getPayeesForCustomer(customerId)  as string[];
            return this.authUser;
        } catch(ex) {
            console.log(JSON.stringify(ex))
            return null;
        }
    }

    private calculateTLSThumbprint(): string {
        // TODO read the TLS certificate and calculate the thumbprint, then store in this.tlsThumbprint   
        return '';
    }

    private buildIntrospecticePostBody(token: string): any {
        let postBody: any = {};
        postBody.token = token.replace('Bearer ', '');
        return postBody;
    }

    private decryptLoginId(token: string) : string {
        let decoded: any = jwtDecode(token);
        let encodedLoginID = decoded?.sub as string;
        let encryptionKey = `${decoded?.software_id}${this.idPermanenceKey}`;
        let buffer = Buffer.from(CryptoUtils.decode(encodedLoginID), 'base64')
        let login = CryptoUtils.decrypt(encryptionKey, buffer);
        return login;
    }

    private decryptAccountArray(token: string) : string[]{
        let decoded: any = jwtDecode(token);
        let accountIds: string [] = [];
        if (Array.isArray(decoded?.account_id) == true)
            accountIds = decoded?.account_id as string[];
        else
            accountIds.push(CryptoUtils.decode(decoded?.account_id));

        let accounts: string[] = [];
        const userNameLength = this.authUser?.loginId?.length as number;
        for(let i = 0; i < accountIds.length; i++) {
            let encryptionKey = `${decoded?.software_id}${this.idPermanenceKey}`;
            let buffer = Buffer.from(CryptoUtils.decode(accountIds[i]), 'base64');
            let decryptedValue = CryptoUtils.decrypt(encryptionKey, buffer);
            let accountId = decryptedValue?.substring(userNameLength)
            accounts.push(accountId);
        }
        return accounts;
    }
}