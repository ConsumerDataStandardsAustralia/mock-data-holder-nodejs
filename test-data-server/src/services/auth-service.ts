import path from "path";
import { CdrUser } from "../models/user";
import * as https from 'https'
import { readFileSync } from "fs";
import { Introspection } from "../models/introspection";
import { JwkKeys } from "../models/jwt-key";
import axios, { Axios, AxiosRequestConfig, HttpStatusCode } from "axios";
import {CipherKey, Hash, KeyExportOptions, KeyObject, createHash} from 'crypto'; 
import * as CryptoJS from 'crypto-js';
import jwtDecode from "jwt-decode";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { Inject, Service } from "typedi";
import { MongoData } from "./database.service";
import { IDatabase } from "./database.interface";
import { enc, lib } from "crypto-js";


export class AuthService {

    token_endpoint: string | undefined;
    introspection_endpoint: string | undefined;
    jwks_uri: string | undefined;
    issuer: string | undefined;
    scopes_supported: string[] | undefined;

    authUser: CdrUser| undefined;
    jwkKeys: JwkKeys[] | undefined;
    tlsThumPrint: string | undefined;

    algorithm = 'AES-256-CBC';
    idPermanenceKey = '90733A75F19347118B3BE0030AB590A8';
    iv = Buffer.alloc(16);

    dbService: IDatabase;


    constructor(dbService: IDatabase) {
        this.dbService = dbService;
    }

    getEncrptionKey(idPermanenceKey: string): Buffer {
        const utf8EncodeText = new TextEncoder();
        let alg = createHash('sha512');
        alg.write(utf8EncodeText.encode(idPermanenceKey));
        let keyH = alg.digest().slice(0,24);
        return keyH;
    }


    decryptLoginId(token: string) : string {
        let decoded: any = jwtDecode(token);
        let encodedLoginID = decoded?.sub  
        // TODO use the idPermanence key to decode the sub field, the return the loginId
        // let buffer = Buffer.from(encryptedUser, 'base64');
        // let iv = randomBytes(16);
        // let keyBuffer = this.getEncrptionKey(this.idPermanenceKey)
        // let keyHash : Buffer = createHash('sha512').update(keyBuffer).digest();
        // let keyHashTargetBuffer = keyHash.subarray(0,24);
        // let decipher = createDecipheriv(this.algorithm, keyHashTargetBuffer, iv);       
        // let decrypted = decipher.update(buffer);
        // TODO enable this when function is working
        //return decrypted.toString();
        return 'koss.blake'
    }

    decryptAccountArray(token: string) : string[]{
        let decoded: any = jwtDecode(token);
        let accountIds: string[] = decoded?.account_id as string[]
        // TODO get the actual accounts by decryption this array
        let accounts : string [] = ['914505516', '238874532']
        return accounts;
    }

    async initAuthService(metadata: any): Promise<boolean> {
        try {
            // set the various endpoints
            this.token_endpoint = metadata?.token_endpoint;
            this.introspection_endpoint = metadata?.introspection_endpoint;
            this.jwks_uri = metadata?.jwks_uri;
            this.issuer = metadata?.issuer;
            this.scopes_supported = metadata?.scopes_supported;

            if (this.jwks_uri == undefined) {
                console.log('ERROR: No jwk endpoint uri found');
                return false;
            }
               
            this.tlsThumPrint = this.calculateTLSThumbprint();
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
            this.authUser = await this.buildUser(token);
            const httpsAgent = this.buildHttpsAgent();
              let config : AxiosRequestConfig = {
                httpsAgent: httpsAgent,
                headers: hdrs
              }
            let postBody = this.buildIntrospecticePostBody(token);
            // TODO enable this lime once the call can get through the MTLS gateway
            //const response = await axios.post(this.introspection_endpoint as string, token, config)
            const response = await axios.post('https://localhost:8001/connect/introspect', postBody, config)
            if (!(response.status == 200)) {
                return false;
              }
            else {
                let intro: Introspection = JSON.parse(response.data);
                return intro.IsActive;
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

    async buildUser(token: string) : Promise<CdrUser | undefined> {
        // First the JWT access token must be decoded and the signature verified
        let decoded: any = jwtDecode(token);

        // decrypt the loginId, ie the sub claim from token:
        // Requires the software_id from the token.
        // The decryption key is the concatenated software_id and the private IdPermance key
        // The IdPermanence key (private key) is kwown to the DH and the Auth server
        try {
            
            
            let loginId = this.decryptLoginId(token);
            let customerId = await this.dbService.getUserForLoginId(loginId, 'person');
            if (customerId == undefined)
               return undefined;

            // TODO use the idPermanence key to decode the account ids, strore in User.accounts
            // Once the customerId (here: userId) has been the account ids can be decrypted.
            // The parameters here are the decrypted customerId from above and the software_id from the token
            // The IdPermanence key (private key) is kwown to the DH and the Auth server
            // TODO decryped account_id array from token
            let accountIds: string[] = this.decryptAccountArray(decoded?.account_id) 
            this.authUser  = {
                loginId : loginId,
                customerId: customerId,
                encodeUserId: decoded?.sub,
                encodedAccounts: decoded?.account_id,
                accounts: accountIds
            }
            return this.authUser;
        } catch(ex) {
            console.log(JSON.stringify(ex))
            return undefined;
        }

        
        

        return ;
    }

    calculateTLSThumbprint(): string {
        // TODO read the TLS certificate and calculate the thumbprint, then store in this.tlsThumbprint
        
        return '';
    }

    buildIntrospecticePostBody(token: string): any {
        // decode the token
        let postBody: any = {};
        let decoded: any = jwtDecode(token);
        
        postBody.client_id = decoded?.client_id;
        postBody.client_assertion = this.buildClientAssertion(token);
        postBody.client_assertion_type = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'; 
        return postBody;
    }

    buildClientAssertion(token: string): string {
        let decoded: any = jwtDecode(token);
        // TODO decode the token and create json structure

        // TODO encode the client_assertion with the jwks key
        return 'eyJhbGciOiJQUzI1NiIsInR5cCI6IkpXVCJ9.eyJraWQiOiJiNThiZDBmZi0wZjkyLTQwZjMtYTgwNC1kYzY1MjZlYzViYzYiLCJzdWIiOiI3NzgzMWM0Mi03ZThiLTQ1N2EtOTNiMi1kNzE0YmIzYjJiYzYiLCJhdWQiOiJodHRwczovL2RoLXRlc3QuaWRwLmRldi5jZHJzYW5kYm94Lmdvdi5hdS9mYXBpLWphcm0iLCJpc3MiOiI3NzgzMWM0Mi03ZThiLTQ1N2EtOTNiMi1kNzE0YmIzYjJiYzYiLCJleHAiOjE2NzY5MzExMDgsImlhdCI6MTY3NjkzMTA0OCwianRpIjoibWVEUURTVkphM0dmWjJVR0dUMHIifQ.cMiSpYQGHQJmcVWTPPeB4ucNyAPYkBx-zbqRBIXzPbEg-DJ5KlvgFVhMc1IUcmygPrGu4TSSr4W8DRTmlHThkqmNrYkOUY1UsMP1VOLPgDw8_dujI-XvuH7xsZojjNoZh53mikEaX4wgOrMs7bBBjHC6h7oO7a50a_2T03DAXKfgERjjMcrLvd8L5Hi7bZKxroKCT1d-azmS2S7_hpViBpqKJBuygkgvsi21vyHb4CwvnoVQIjpTx88YGrsQxlWApaohccgyt0vj9orRtWqjyikvczpRLq-cqyaaFv3S6fQ76MJ4z2Ojj7uLQzcG7j6sT3Z301ORTpfQfRJmGEMxyg';
    }
}