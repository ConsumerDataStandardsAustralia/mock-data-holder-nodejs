
import { IAuthData } from "./database-auth.interface";
import * as mongoDB from "mongodb";
import { IEnergyData } from "./database-energy.interface";
import { Service } from "typedi";
import { AccountModel, CustomerModel } from "../models/login";

@Service()
export class AuthDataService implements IAuthData {

    public collections: mongoDB.Collection[] = [];
    private client: mongoDB.MongoClient;
    private dsbData: mongoDB.Db;

    private isSingleDoc: boolean = true;

    constructor(connString: string, dbName: string) {
        this.client = new mongoDB.MongoClient(connString, { monitorCommands: true });
        this.dsbData = this.client.db(dbName);
        const isSingleString = process.env.DATA_IS_SINGLE_DOCUMENT;
        this.isSingleDoc = isSingleString?.toLowerCase() == 'true' ? true : false;
        this.isSingleDoc = isSingleString?.toLowerCase() == 'false' ? false : true;
    }


    async getUserForLoginId(loginId: string, userType: string): Promise<string | undefined> {
        if (this.isSingleDoc == true)
            return this.getUserForLoginIdSingle(loginId, userType)
        else
            return this.getUserForLoginIdMongo(loginId, userType)
    }

    async getLoginInformation(sectors: string[]): Promise<CustomerModel[] | undefined> {
        if (this.isSingleDoc == true)
            return this.getLoginInformationSingle(sectors)
        else
            return this.getLoginInformationMongo(sectors)
    }

    async getUserForLoginIdSingle(loginId: string, userType: string): Promise<string | undefined> {
        // split loginId into first and last name
        var customerId;
        let arr: string[] = loginId.split('.');
        if (arr.length < 2)
            return undefined;
        let firstName = arr[1];
        let lastName = arr[0];
        let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
        let allData = await allDataCollection.findOne();
        if (allData?.holders != undefined) {
            let allCustomers = allData?.holders[0]?.holder?.authenticated?.customers;
            if (allCustomers.length < 1)
                return undefined;
            allCustomers.forEach((c: any) => {
                if (c?.customer?.person?.firstName.toUpperCase() == firstName.toUpperCase()
                    && c?.customer?.person?.lastName.toUpperCase() == lastName.toUpperCase()) {
                    customerId = c.customerId;
                }
            })
        }
        return customerId;
    }

    async getUserForLoginIdMongo(loginId: string, userType: string): Promise<string | undefined> {
        // split login name to find first and last name
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME_AUTH as string);
        let arr: string[] = loginId.split('.');
        if (arr.length < 2)
            return undefined;
        let firstName = arr[1];
        let lastName = arr[0];
        const query = { firstName: firstName, lastName: lastName };
        let cust: any = await customers.findOne(query);
        return cust?.customerId;
    }

    async getLoginInformationMongo(sectors: string[]): Promise<CustomerModel[] | undefined> {
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        var loginModel: CustomerModel[] = [];
        let cursor = await customers.find().toArray();

        for (let cnt = 0; cnt < cursor.length; cnt++) {
            let aModel: CustomerModel = {
                LoginId: "",
                Accounts: []
            };
            aModel.LoginId = `${cursor[cnt].customer?.person?.lastName}.${cursor[cnt].customer?.person?.firstName}`;
            let accounts: AccountModel[] = [];
            if (sectors.indexOf('energy') > 0) {
                // get the energy login data
                cursor[cnt]?.energy?.accounts.forEach((acc: any) => {
                    let loginAccount: AccountModel = {
                        AccountId: acc?.account?.accountId,
                        AccountNumber: acc?.account?.accountNumber,
                        MaskedName: acc?.account?.maskedNumber,
                        DisplayName: acc?.account?.displayName
                    };
                    accounts.push(loginAccount)
                })
                aModel.Accounts = accounts;
                loginModel.push(aModel);

            }
            if (sectors.indexOf('banking') > 0) {
                // get the banking login data
                cursor[cnt]?.banking?.accounts.forEach((acc: any) => {
                    let loginAccount: AccountModel = {
                        AccountId: acc?.account?.accountId,
                        AccountNumber: acc?.account?.accountNumber,
                        MaskedName: acc?.account?.maskedNumber,
                        DisplayName: acc?.account?.displayName
                    };
                    accounts.push(loginAccount)
                })
                aModel.Accounts = accounts;
                loginModel.push(aModel);
            }
        }

        return loginModel;
    }

    // get all the logins for the ACCC cdr-auth-server UI
    async getLoginInformationSingle(sectors: string[]): Promise<CustomerModel[] | undefined> {
        var loginModel: CustomerModel[] = [];
        let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
        let allData = await allDataCollection.findOne();
        if (allData?.holders != undefined) {
            let allCustomers = allData?.holders[0]?.holder?.authenticated?.customers;
            if (allCustomers == undefined || allCustomers.length < 1)
                return undefined;
            allCustomers.forEach((c: any) => {
                let aModel: CustomerModel = {
                    LoginId: "",
                    Accounts: []
                };
                aModel.LoginId = `${c.customer?.person?.lastName}.${c.customer?.person?.firstName}`;
                let accounts: AccountModel[] = [];
                if (sectors.indexOf('energy') > -1) {
                    // get the energy login data
                    c?.energy?.accounts.forEach((acc: any) => {
                        let loginAccount: AccountModel = {
                            AccountId: acc?.account?.accountId,
                            AccountNumber: acc?.account?.accountNumber,
                            MaskedName: acc?.account?.maskedNumber,
                            DisplayName: acc?.account?.displayName
                        };
                        accounts.push(loginAccount)
                    })
                    aModel.Accounts = accounts;
                    
                }
                if (sectors.indexOf('banking') > -1) {
                    // get the banking login data
                    c?.banking?.accounts.forEach((acc: any) => {
                        let loginAccount: AccountModel = {
                            AccountId: acc?.account?.accountId,
                            AccountNumber: acc?.account?.accountNumber,
                            MaskedName: acc?.account?.maskedNumber,
                            DisplayName: acc?.account?.displayName
                        };
                        accounts.push(loginAccount)
                    })
                    aModel.Accounts = accounts;
                }
                loginModel.push(aModel);

            })
        }
        else {
            return undefined;
        }
        return loginModel;
    }

    async connectDatabase() {
        try {
            await this.client.connect();
        }
        catch (e) {
            console.log(`Failed to connet to MongoDB${JSON.stringify(e)}`)
        }

    }

    async disconnectDatabase() {
        try {
            await this.client.close();
        }
        catch (e) {
            console.log(`Failed to connet to MongoDB${JSON.stringify(e)}`)
        }
    }

    async getCollections(): Promise<string[]> {
        let retList: string[] = [];
        let collections = await this.dsbData.collections();
        let name = this.dsbData.databaseName;
        let cnt = await collections.length;
        collections.forEach(c => {
            retList.push(c.collectionName)
        })
        return retList;
    }


}
