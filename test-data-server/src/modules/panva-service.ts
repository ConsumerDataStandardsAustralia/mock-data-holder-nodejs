import path from "path";
import { DsbCdrUser } from "../models/user";
import * as https from 'https'
import * as http from 'https'
import { readFileSync } from "fs";
import { Introspection } from "../models/introspection";
import { JwkKey } from "../models/jwt-key";
import axios, { Axios, AxiosRequestConfig } from "axios";
import jwtDecode from "jwt-decode";
import { IDatabase } from "../services/database.interface";
import { CryptoUtils } from "../utils/crypto-utils";
import { IAuthService } from "./auth-service.interface";
import { EnergyServicePoint } from "consumer-data-standards/energy";
import { unescape } from "querystring";
import { CdrArrangement } from "./cdr-arrangement.model";


export class PanvaAuthService implements IAuthService {

    private introspection_endpoint: string | undefined;
    private introspection_endpoint_internal: string | undefined;


    authUser: DsbCdrUser| undefined;
    private jwkKeys: JwkKey[] | undefined;
    private tlsThumPrint: string | undefined;
    private jwtEncodingAlgorithm: string;
    private issuer: string | undefined;
    private jwks_uri: string | undefined;
    private algorithm = 'AES-256-CBC';
    private token_endpoint:  string | undefined;
    // This key must be the same on the authorisation server
    private idPermanenceKey = process.env.IDPERMANENCEKEY;
    private iv = Buffer.alloc(16);
    private dbService: IDatabase;

    constructor(dbService: IDatabase) {
        this.dbService = dbService;
        this.jwtEncodingAlgorithm = 'ES256';
        this.introspection_endpoint_internal = process.env.INTERNAL_INTROSPECTION;
    }

    public async initAuthService(): Promise<boolean> {
        try {
            console.log('Initialise auth service..');
            // TODO Https
            // const httpAgent = this.buildHttpsAgent();
            //   let config : AxiosRequestConfig = {
            //     httpsAgent: httpsAgent,
            //   }

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

    private async getArrangement(id: string): Promise<any> {
        let authHeader = this.buildBasicAuthHeader();
        let config : AxiosRequestConfig = {
            headers: {'Authorization': `${authHeader}`}
        };
        let url: string = this.introspection_endpoint_internal + id
        const response = await axios.get(url, config)
        // response.data will be a CDrArrangment object as defined in dsb-panva-oidc--provider
        return response;
    }
    
    public async verifyAccessToken(token: string): Promise<boolean> {
        try {
            // no introspective endpoint exists
            if (this.introspection_endpoint_internal == undefined)
               return false;
            let authHeader = this.buildBasicAuthHeader();
            let hdrs = {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `${authHeader}`
                    } ;
            const httpAgent = this.buildHttpAgent();
              let config : AxiosRequestConfig = {
                headers: hdrs
              }
            let tokeToBeValidated = token.split(' ')[1];
            let postBody = this.buildIntrospecticePostBody(tokeToBeValidated);
            const response = await axios.post(this.introspection_endpoint as string, postBody, config)
            if (!(response.status == 200)) {
                return false;
              }
            else {
                let arrangement : any = await this.getArrangement(response?.data?.cdr_arrangement_id);
                await this.buildUser(arrangement?.data);
                return true;
            }
        } catch (error: any) {
            console.log('ERROR: ', error.message);
            console.log('ERROR DETAIL', error?.response?.data);   
            return false;
        }
    }

    // This header is used for introspection calls, using Basic Auth "client_id:secret"
    private buildBasicAuthHeader(): string {    
        let basic = 'Basic ';
        let authString = `${unescape(process.env.CLIENT_ID ?? '')}:${unescape(process.env.CLIENT_SECRET ?? '')}`;
        let authString64 = Buffer.from(authString).toString('base64url');
        return `${basic}${authString64}`
        
    }

    private buildHttpAgent(): http.Agent {
        let httpsAgent = new http.Agent({
            //ca: readFileSync(path.join(__dirname, '../security/cdr-auth-server/mtls', process.env.CA_FILE as string))
           })
        return httpsAgent;
    }

    // TODO USed with https
    private buildHttpsAgent(): https.Agent {
        let httpsAgent = new https.Agent({
            ca: readFileSync(path.join(__dirname, '../security/cdr-auth-server/mtls', process.env.CA_FILE as string))
           })
        return httpsAgent;
    }

    private async buildUser(arrangement: CdrArrangement) : Promise<boolean> {
        try {
                
            let loginId = arrangement.loginId;
            let customerId = await this.dbService.getUserForLoginId(loginId, 'person');
            if (customerId == undefined)
               return false;
            this.authUser  = {
                loginId : loginId,
                customerId: customerId,
                encodeUserId: arrangement.loginId,
                encodedAccounts: undefined,
                accountsEnergy: arrangement.consentedEnergyAccounts,
                accountsBanking: arrangement.consentedBankingAccounts,
                scopes_supported: arrangement.scopes.split(' ')
            }
            this.authUser.energyServicePoints = await this.dbService.getServicePointsForCustomer(customerId) as string[];
            this.authUser.bankingPayees = await this.dbService.getPayeesForCustomer(customerId)  as string[];
            return true;
        } catch(ex) {
            console.log(JSON.stringify(ex))
            return false;
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