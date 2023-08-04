import path from "path";
import { User } from "../models/user";
import * as https from 'https'
import { readFileSync } from "fs";
import { Introspection } from "../models/introspection";
import { JwkKeys } from "../models/jwt-key";


export class AuthService {

    token_endpoint: string | undefined;
    introspection_endpoint: string | undefined;
    jwks_uri: string | undefined;
    issuer: string | undefined;
    scopes_supported: string[] | undefined;



    authUser: User| undefined;
    jwkKeys: JwkKeys[] | undefined;

    constructor() {
    }

    public verifyAccessToken(token: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            if (this.introspection_endpoint == undefined)
               return;
            const certFile = path.join(__dirname, '../certificates/mtls-server.pem')
            const keyFile = path.join(__dirname, '../certificates/mtls-server.key')
            //const caFile = path.join(__dirname, '../certificates/ca.pem')
            const rCert = readFileSync(certFile, 'utf8');
            const rKey = readFileSync(keyFile, 'utf8');
            //const rCA = readFileSync(caFile, 'utf8');
            let options = this.buildHttpsRequestOptions(this.introspection_endpoint, "POST");
            options.headers = {
                        'X-TlsClientCertThumbprint': 'gdsajdhjhjhasd',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }    
            let req = await https.request(options, (response) => {
                let chunks_of_data: any = [];

                response.on('data', (fragments) => {
                    chunks_of_data.push(fragments);
                    let response_body = Buffer.concat(chunks_of_data).toJSON();
                    resolve(true)
                });

                response.on('end', () => {
                    let response_body = Buffer.concat(chunks_of_data);
                    let intro : Introspection =  JSON.parse(response_body.toString());
                    resolve(true);
                });
        
                response.on('error', (error) => {
                    reject(error);
                });
            });
            req.write(token);
            req.end();
            
        });
    }

    public async initAuthService(metadata: any): Promise<boolean> {
        return new Promise(async (resolve, reject) => {

            let retVal: boolean = false;
            this.token_endpoint = metadata?.token_endpoint;
            this.introspection_endpoint = metadata?.introspection_endpoint;
            this.jwks_uri = metadata?.jwks_uri;
            this.issuer = metadata?.issuer;
            this.scopes_supported = metadata?.scopes_supported;
    
            if (this.jwks_uri == undefined)
                return retVal;
            let options = this.buildHttpsRequestOptions(this.jwks_uri, "GET")
            // get the jwks signing key
            let req = await https.request(options, (response:any) => {
                let chunks_of_data: any = [];
    
                response.on('data', (keys:any) => {
                    chunks_of_data.push(keys);
                    resolve(true)
                });
    
                response.on('end', () => {
                    let response_body = Buffer.concat(chunks_of_data);
                    let keys : JwkKeys[] =  JSON.parse(response_body.toString());
                    this.jwkKeys = keys;
                    resolve(true)
                });      
                response.on('error', (error: any) => {
                    retVal = false;
                    reject(error)
                });
            });
            req.end();        
        })
 
    }
    
    buildHttpsRequestOptions(url: string, method: string): https.RequestOptions {
        const certFile = path.join(__dirname, '../certificates/mtls-server.pem')
        const keyFile = path.join(__dirname, '../certificates/mtls-server.key')
        const rCert = readFileSync(certFile, 'utf8');
        const rKey = readFileSync(keyFile, 'utf8');
        let urlObj = new URL(url);
        let options: https.RequestOptions = {
            host: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            cert: rCert,
            key: rKey,
            method: method 
        } 
        return options;
    }

    getUser(): User | undefined {
        return this.authUser;
    }

    getUserAccounts(): string[] {
        let accounts: string[]= [];
        // decode account ids
        this.authUser?.accounts.forEach(elem => {
            let acc: string = elem // TODO decode
        })
        return accounts;
    }
}