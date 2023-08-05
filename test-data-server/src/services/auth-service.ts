import path from "path";
import { User } from "../models/user";
import * as https from 'https'
import { readFileSync } from "fs";
import { Introspection } from "../models/introspection";
import { JwkKeys } from "../models/jwt-key";
import axios, { Axios, AxiosRequestConfig, HttpStatusCode } from "axios";


export class AuthService {

    token_endpoint: string | undefined;
    introspection_endpoint: string | undefined;
    jwks_uri: string | undefined;
    issuer: string | undefined;
    scopes_supported: string[] | undefined;

    authUser: User| undefined;
    jwkKeys: JwkKeys[] | undefined;
    tlsThumPrint: string;


    constructor() {
        this.tlsThumPrint = "GIVEMEATHUMBPRINT"
    }

    async initAuthService(metadata: any): Promise<boolean> {
        try {
            // no jwks_uri exists
            this.token_endpoint = metadata?.token_endpoint;
            this.introspection_endpoint = metadata?.introspection_endpoint;
            this.jwks_uri = metadata?.jwks_uri;
            this.issuer = metadata?.issuer;
            this.scopes_supported = metadata?.scopes_supported;

            if (this.jwks_uri == undefined)
               return false;

            const httpsAgent = this.buildHttpsAgent();
              let config : AxiosRequestConfig = {
                httpsAgent: httpsAgent,
              }

            const response = await axios.get(this.jwks_uri as string,  config)
            if (!(response.status == 200)) {
                return false;
              }
            else {
                this.jwkKeys = response.data?.keys;
                return true;
            }
        } catch (error: any) {
            console.log('ERROR: ', error.message);
            console.log('ERROR DETAIL', error?.response?.data);   
            return false;
        }       
    }
    
    async verifyAccessToken(token: string): Promise<boolean> {
        try {
            // no introspective endpoint exists
            if (this.introspection_endpoint == undefined)
               return false;
            let hdrs = {
                        'X-TlsClientCertThumbprint': this.tlsThumPrint,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    } ; 

            const httpsAgent = this.buildHttpsAgent();
              let config : AxiosRequestConfig = {
                httpsAgent: httpsAgent,
                headers: hdrs
              }
            // TODO enable this lime once the call can get through the MTLS gateway
            //const response = await axios.post(this.introspection_endpoint as string, token, config)
            const response = await axios.post('https://localhost:8001/connect/introspect', token, config)
            if (!(response.status == 200)) {
                let st = response.data;
                return false;
              }
            else {
                let intro: Introspection = JSON.parse(response.data);
                return true;
            }
        } catch (error: any) {
            console.log('ERROR: ', error.message);
            console.log('ERROR DETAIL', error?.response?.data);   
            return false;
        }
    }


    buildHttpsAgent(): https.Agent {
        let httpsAgent = new https.Agent({
            cert: readFileSync(path.join(__dirname, '../certificates/mtls-server.pem')),
            key: readFileSync(path.join(__dirname, '../certificates/mtls-server.key')),
          })
        return httpsAgent;
    }

    buildUser(token: string){
        // TODO use the idPermanence key to decode the sub field, store in User.userId
        // TODO use the idPermanence key to decode the account ids, strore in User.accounts

        return ;
    }

    calculateTLSThumbprint() {
        // TODO read the TLS certificate and calculate the thumbprint, then store in this.tlsThumbprint
    }

    buildClientAssertion(token: string): string {
        // TODO decode the token and create json structure
        // TODO encode the client_assertion with the jwks key
        return '';
    }
}