import path from "path";
import { CdrUser } from "../models/user";
import * as https from 'https'
import { readFileSync } from "fs";
import { Introspection } from "../models/introspection";
import { JwkKey } from "../models/jwt-key";
import axios, { Axios, AxiosRequestConfig, HttpStatusCode } from "axios";
import {CipherKey, Hash, KeyExportOptions, KeyObject, createHash} from 'crypto'; 
import * as CryptoJS from 'crypto-js';
import jwtDecode from "jwt-decode";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { Inject, Service } from "typedi";
import { MongoData } from "./database.service";
import { IDatabase } from "./database.interface";
import { enc, lib } from "crypto-js";
import { CryptoUtils } from "../utils/crypto-utils";


export class AuthService {

    token_endpoint: string | undefined;
    introspection_endpoint: string | undefined;
    jwks_uri: string | undefined;
    issuer: string | undefined;
    scopes_supported: string[] | undefined;

    authUser: CdrUser| undefined;
    jwkKeys: JwkKey[] | undefined;
    tlsThumPrint: string | undefined;
    jwtEncodingAlgorithm: string | undefined;
    algorithm = 'AES-256-CBC';
    // This key must be the same on the authorisation server
    idPermanenceKey = '90733A75F19347118B3BE0030AB590A8';
    iv = Buffer.alloc(16);

    // The ACCC implementation of the CDrAuthServer has an internal introspection endpoint
    // When this is called only the Access Token is pur in the POST request
    // instread of a client assertion request as required by the introspection endpoint
    useInternalIntrospectiveEndpoint: boolean; 

    dbService: IDatabase;


    constructor(dbService: IDatabase) {
        this.dbService = dbService;
        this.jwtEncodingAlgorithm = 'PS256';
        this.useInternalIntrospectiveEndpoint = true;
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
            const response = await axios.post('https://localhost:8001/connect/introspect-internal', postBody, config)
            if (!(response.status == 200)) {
                return false;
              }
            else {
                let intro: Introspection = response.data as Introspection;
                return intro.Active;
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
            let accountIds: string[] = this.decryptAccountArray(token) 
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
    }

    calculateTLSThumbprint(): string {
        // TODO read the TLS certificate and calculate the thumbprint, then store in this.tlsThumbprint
        
        return '';
    }

    buildIntrospecticePostBody(token: string): any {
        // decode the token
        let postBody: any = {};
        let decoded: any = jwtDecode(token);
        if (this.useInternalIntrospectiveEndpoint == true) {
            postBody.token = token.replace('Bearer ', '');
        } else {
            postBody.client_id = decoded?.client_id;
            postBody.client_assertion = this.buildClientAssertion(token);
            postBody.client_assertion_type = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'; 
            postBody.grant_type = '';
            postBody.scope = decoded?.scope;
        }  
        return postBody;
    }

    buildClientAssertion(token: string): string {
        let decoded: any = jwtDecode(token);
        let header = {
            alg: this.jwtEncodingAlgorithm,
            typ: 'JWT',
            version: true
        }
        const b64Header = CryptoUtils.jsonObjectToBase64 (header);
        const jwtB64Header = CryptoUtils.replaceSpecialChars (b64Header);

        // get the encoding algo from jwtKeys
        let encKey = this.jwkKeys?.find(x => x.alg == this.jwtEncodingAlgorithm);
        let x5cKeys = encKey?.x5c;
        let key = '';
        if (x5cKeys == undefined)
            return '';
        else
            key = x5cKeys[0];
        /*
        {
        "kid": "7C5716553E9B132EF325C49CA2079737196C03DB",
        "sub": "77831c42-7e8b-457a-93b2-d714bb3b2bc6",
        "aud": "https://localhost:3005",
        "iss": "77831c42-7e8b-457a-93b2-d714bb3b2bc6",
        "exp": 1876931108,
        "iat": 1676931048,
        "jti": "meDQDSVJa3GfZ2UGGT0r"
        }*/
        let payload = {
            kid: encKey?.kid,
            sub: decoded.client_id,
            aud: 'https://localhost:3003',
            iss: decoded.client_id,
            jti: decoded.jti,
            exp: decoded.exp,
            iat: decoded.iat
        }
        
        const b64Payload = CryptoUtils.jsonObjectToBase64 (payload);
        const jwtB64Payload = CryptoUtils.replaceSpecialChars (b64Payload);
        let signature = CryptoUtils.createSha256Signature(jwtB64Header, jwtB64Payload, key)
        const jsonWebToken = jwtB64Header + '.' + jwtB64Payload + '.' + signature;
        return jsonWebToken;

        // TODO encode the client_assertion with the jwks key
       //  return 'eyJhbGciOiJQUzI1NiIsInR5cCI6IkpXVCJ9.eyJraWQiOiJiNThiZDBmZi0wZjkyLTQwZjMtYTgwNC1kYzY1MjZlYzViYzYiLCJzdWIiOiI3NzgzMWM0Mi03ZThiLTQ1N2EtOTNiMi1kNzE0YmIzYjJiYzYiLCJhdWQiOiJodHRwczovL2RoLXRlc3QuaWRwLmRldi5jZHJzYW5kYm94Lmdvdi5hdS9mYXBpLWphcm0iLCJpc3MiOiI3NzgzMWM0Mi03ZThiLTQ1N2EtOTNiMi1kNzE0YmIzYjJiYzYiLCJleHAiOjE2NzY5MzExMDgsImlhdCI6MTY3NjkzMTA0OCwianRpIjoibWVEUURTVkphM0dmWjJVR0dUMHIifQ.cMiSpYQGHQJmcVWTPPeB4ucNyAPYkBx-zbqRBIXzPbEg-DJ5KlvgFVhMc1IUcmygPrGu4TSSr4W8DRTmlHThkqmNrYkOUY1UsMP1VOLPgDw8_dujI-XvuH7xsZojjNoZh53mikEaX4wgOrMs7bBBjHC6h7oO7a50a_2T03DAXKfgERjjMcrLvd8L5Hi7bZKxroKCT1d-azmS2S7_hpViBpqKJBuygkgvsi21vyHb4CwvnoVQIjpTx88YGrsQxlWApaohccgyt0vj9orRtWqjyikvczpRLq-cqyaaFv3S6fQ76MJ4z2Ojj7uLQzcG7j6sT3Z301ORTpfQfRJmGEMxyg';
    }
}