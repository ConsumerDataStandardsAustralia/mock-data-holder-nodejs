import { DsbCdrUser } from "../models/user";
import { JwkKey } from "../models/jwt-key";
import axios, { AxiosRequestConfig, RawAxiosRequestHeaders } from "axios";
import { IDatabase } from "../services/database.interface";
import { IAuthService } from "./auth-service.interface";
import { unescape } from "querystring";
import jwtDecode from "jwt-decode";


export class KeycloakAuthService implements IAuthService {

    authUser: DsbCdrUser| undefined;
    
    private introspection_endpoint: string | undefined;
    private issuer: string | undefined;
    private jwks_uri: string | undefined;
    private token_endpoint:  string | undefined;
    private dbService: IDatabase;

    constructor(dbService: IDatabase) {
        this.dbService = dbService;
    }

    public async initAuthService(): Promise<boolean> {
        try {
            console.log('Initialise auth service...');
            const url = `${process.env.AUTH_SERVER_URL}/.well-known/openid-configuration`
            console.log(`Auth server url: ${url}`);
            const response = await axios.get(url)
            if (!(response.status == 200)) {
                console.log('Auth server discovery failed.');
                return false;
            }
            console.log(`Auth server discovery complete. ${JSON.stringify(response.data)}`);
            // set the various endpoints
            this.token_endpoint = response.data?.token_endpoint;
            this.introspection_endpoint = response.data?.introspection_endpoint;
            this.jwks_uri = response.data?.jwks_uri;
            this.issuer = response.data?.issuer;
            return true;
        } catch (error: any) {
            console.error('ERROR:', error.message);
            console.error('ERROR DETAIL:', error?.response?.data);   
            return false;
        }       
    }

    public async verifyAccessToken(token: string): Promise<boolean> {
        if (!this.introspection_endpoint) {
            // no introspective endpoint exists
            return false;
        }
        try {
            const config : AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                } as RawAxiosRequestHeaders,
                method: 'POST'
            }
            console.log(`Token reponse is ${token}`)
            const postBody: any = {
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                token: token.split(' ')[1]
            }
            const response = await axios.post(this.introspection_endpoint, postBody, config)
            if (response.status != 200) {
                return false;
            }
            if (await this.buildUser(token) && this.authUser) {
                const arrangement : any = await axios.get(`${process.env.CDR_ARRANGEMENT_ENDPOINTS}/accounts/${this.authUser.loginId}/${response?.data?.cdr_arrangement_id}`)
                const accounts : [string] = arrangement?.data;
                this.authUser.accountsEnergy = accounts;
                this.authUser.accountsBanking = accounts;
                return true;
            }
            return false;
        } catch (error: any) {
            console.error('ERROR:', error.message);
            console.error('ERROR DETAIL:', error?.response?.data);   
            return false;
        }
    }

    private async buildUser(token: string) : Promise<boolean> {
        try {
            let decoded : any = jwtDecode(token);
            let loginId : string = decoded?.sub;
            let customerId = await this.dbService.getUserForLoginId(loginId, 'person');
            if (customerId == undefined) {
                return false;
            }
            this.authUser = {
                loginId : loginId,
                customerId: customerId,
                encodeUserId: loginId,
                encodedAccounts: undefined,
                accountsEnergy: undefined,
                accountsBanking: undefined,
                scopes_supported: decoded?.scope,
                energyServicePoints: await this.dbService.getServicePointsForCustomer(customerId) as string[],
                bankingPayees: await this.dbService.getPayeesForCustomer(customerId) as string[]
            }
            return true;
        } catch(ex) {
            console.error(JSON.stringify(ex))
            return false;
        }
    }
}