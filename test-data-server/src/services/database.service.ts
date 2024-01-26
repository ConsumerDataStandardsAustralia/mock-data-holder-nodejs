import { LinksPaginated, MetaPaginated } from "consumer-data-standards/banking";
import { ResponseCommonCustomerDetailV2 } from "consumer-data-standards/common";
import { EnergyAccount, EnergyAccountDetailV2, EnergyBalanceListResponse, EnergyBalanceResponse,
    EnergyBillingListResponseV2, EnergyConcessionsResponse, EnergyDerDetailResponse, EnergyDerListResponse, EnergyDerRecord,
    EnergyInvoiceListResponse, EnergyPaymentScheduleResponse, EnergyPlan, EnergyServicePoint, EnergyServicePointDetail,
    EnergyServicePointListResponse, EnergyUsageListResponse, EnergyUsageRead, Links, Meta } from "consumer-data-standards/energy";
import * as mongoDB from "mongodb";
import { IDatabase } from "./database.interface";
import { Service } from "typedi";
import { AccountModel, CustomerModel } from "../models/login";
import { response } from "express";

@Service()
export class MongoData implements IDatabase {

    public collections: mongoDB.Collection[] = [];
    private client: mongoDB.MongoClient;
    private dsbData: mongoDB.Db;

    constructor(connString: string, dbName: string) {
        this.client = new mongoDB.MongoClient(connString, { monitorCommands: true });
        this.dsbData = this.client.db(dbName);
    }
    async getBalancesForMultipleAccount(customerId: string, accountIds: string[]): Promise<any> {
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };
        let cust: any = await customers.findOne(query);
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        let balances: any[] = [];


        cust?.energy?.accounts?.forEach((acc: any) => {
            var idx = accountIds?.indexOf(acc.account.accountId)
            if (idx > -1) {
                let balance: any = {
                    balance: acc.balance,
                    accountId: acc.account.accountId
                }
                balances.push(balance);
            }
        })
        let ret: EnergyBalanceListResponse = {
            data: {
                balances: balances
            },
            links: l,
            meta: m
        }
        return ret;
    }
    async getBulkUsageForUser(customerId: string): Promise<any> {
        let ret: any = {};
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };


        let cust: any = await customers.findOne(query);
        let retArray: any[] = [];
        //let allAccounts: any[] = await cust.energy?.accounts?.length;
        cust?.energy?.servicePoints?.forEach((sp: any) => {
            if (sp?.usage != null) {
                retArray.push(...sp?.usage);
            }
        })

        ret.data = { reads: retArray };
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        ret.links = l;
        ret.meta = m;
        return ret;
    }
    async getBulkDerForUser(customerId: string): Promise<any> {
        let ret: any = {};
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };


        let cust: any = await customers.findOne(query);
        let retArray: any[] = [];
        //let allAccounts: any[] = await cust.energy?.accounts?.length;
        cust?.energy?.servicePoints?.forEach((sp: any) => {
            if (sp?.der != null) {
                retArray.push(sp?.der);
            }
        })

        ret.data = { derRecords: retArray };
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        ret.links = l;
        ret.meta = m;
        return ret;
    }

    async getBulkBilllingForUser(customerId: string): Promise<any> {
        let ret: any = {};
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };


        let cust: any = await customers.findOne(query);
        let retArray: any[] = [];
        //let allAccounts: any[] = await cust.energy?.accounts?.length;
        cust?.energy?.accounts.forEach((acc: any) => {
            retArray.push(...acc?.transactions)
        });

        ret.data = { transactions: retArray };
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        ret.links = l;
        ret.meta = m;
        return ret;
    }
    async getBulkBalancesForUser(customerId: string): Promise<any> {
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };
        let cust: any = await customers.findOne(query);
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        let balances: any[] = [];
        cust?.energy?.accounts?.forEach((acc: any) => {
            let balance: any = {
                balance: acc.balance,
                accountId: acc.account.accountId
            }
            balances.push(balance);
        })
        let ret: EnergyBalanceListResponse = {
            data: {
                balances: balances
            },
            links: l,
            meta: m
        }
        return ret;
    }
    async getBulkInvoicesForUser(customerId: string): Promise<any> {
        let ret: any = {};
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };


        let cust: any = await customers.findOne(query);
        let retArray: any[] = [];
        //let allAccounts: any[] = await cust.energy?.accounts?.length;
        cust?.energy?.accounts.forEach((acc: any) => {
            retArray.push(...acc?.invoices)
        });

        ret.data = { invoices: retArray };
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        ret.links = l;
        ret.meta = m;
        return ret;
    }

    async getEnergyAllPlans(): Promise<any> {
        let ret: any = {};
        let plansCollection: mongoDB.Collection = this.dsbData.collection(process.env.PLAN_COLLECTION_NAME as string);
        const query = {};

        let planCount: any = await plansCollection.countDocuments();
        let allPlans: any = await plansCollection.find({});
        let retArray: any[] = [];
        await allPlans.forEach((p: EnergyPlan) =>
            retArray.push(p));
        ret.data = { plans: retArray };
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        ret.links = l;
        ret.meta = m;
        return ret;
    }
    async getEnergyPlanDetails(planId: string): Promise<any> {
        let ret: any = {};
        let plans: mongoDB.Collection = this.dsbData.collection(process.env.PLAN_COLLECTION_NAME as string);
        const query = { planId: planId };
        let plan: any = await plans.findOne(query, { projection: { _id: 0 } });

        ret.data = plan;
        let l: Links = {
            self: ""
        }
        let m: Meta = {

        }
        ret.links = l;
        ret.meta = m;
        return ret;
    }
    async getConcessionsForAccount(customerId: string, accountId: string): Promise<any> {
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };
        let cust: any = await customers.findOne(query);
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        let ret: EnergyConcessionsResponse = {
            data: {
                concessions: []
            },
            links: l,
            meta: m,
        }
        cust?.energy?.accounts?.forEach((acc: any) => {
            if (acc.account.accountId == accountId) {
                if (acc?.concessions != null) {
                    ret.data.concessions.push(...acc?.concessions);
                }
            }
        })
        return ret;
    }
    async getPaymentSchedulesForAccount(customerId: string, accountId: string): Promise<any> {
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };
        let cust: any = await customers.findOne(query);
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        let ret: EnergyPaymentScheduleResponse = {
            data: {
                paymentSchedules: []
            },
            links: l,
            meta: m,
        }
        cust?.energy?.accounts?.forEach((acc: any) => {
            if (acc.account.accountId == accountId) {
                if (acc?.paymentSchedule != null) {
                    ret.data.paymentSchedules.push(...acc?.paymentSchedule);
                }
            }
        })
        return ret;
    }
    async getServicePoints(customerId: string): Promise<any> {
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };
        let cust: any = await customers.findOne(query);
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        let ret: EnergyServicePointListResponse = {
            data: {
                servicePoints: []
            },
            links: l,
            meta: m
        }
        let spList: any[] = [];
        let spDetailList = cust?.energy?.servicePoints as EnergyServicePointDetail[];
        if (spDetailList != null) {
            spDetailList.forEach((sp: any) => {
                let newSP: EnergyServicePoint = {
                    jurisdictionCode: sp.servicePoint.jurisdictionCode,
                    lastUpdateDateTime: sp.servicePoint.lastUpdateDateTime,
                    nationalMeteringId: sp.servicePoint.nationalMeteringId,
                    servicePointClassification: sp.servicePoint.servicePointClassification,
                    servicePointId: sp.servicePoint.servicePointId,
                    servicePointStatus: sp.servicePoint.servicePointStatus,
                    validFromDate: sp.servicePoint.validFromDate
                }
                if (sp.servicePoint.consumerProfile) newSP.consumerProfile = sp.servicePoint.consumerProfile;
                if (sp.servicePoint.isGenerator) newSP.isGenerator = sp.servicePoint.isGenerator;
                spList.push(newSP);
            })
            ret.data.servicePoints = spList;
        }
        return ret;
    }

    async getBillingForMultipleAccounts(customerId: string, accountIds: string[]): Promise<any> {
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };
        let cust: any = await customers.findOne(query);
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        let ret: EnergyBillingListResponseV2 = {
            data: {
                transactions: []
            },
            links: l,
            meta: m
        }
        cust?.energy?.accounts?.forEach((acc: any) => {
            var idx = accountIds?.indexOf(acc.account.accountId)
            if (idx > -1) {
                if (acc?.invoices != null) {
                    ret.data.transactions.push(...acc?.transactions);
                }
            }
        })
        return ret;
    }
    async getInvoicesForMultipleAccounts(customerId: string, accountIds: string[]): Promise<any> {
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };
        let cust: any = await customers.findOne(query);
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        let ret: EnergyInvoiceListResponse = {
            data: {
                invoices: []
            },
            links: l,
            meta: m
        }
        cust?.energy?.accounts?.forEach((acc: any) => {
            var idx = accountIds?.indexOf(acc.account.accountId)
            if (idx > -1) {
                if (acc?.invoices != null) {
                    ret.data.invoices.push(...acc?.invoices);
                }
            }
        })
        return ret;
    }
    async getDerForMultipleServicePoints(customerId: string, severvicePointIds: string[]): Promise<any> {
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };
        let cust: any = await customers.findOne(query);
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        let ret: EnergyDerListResponse = {
            data: {
                derRecords: []
            },
            links: l,
            meta: m
        }
        cust?.energy?.servicePoints?.forEach((sp: any) => {
            var idx = severvicePointIds?.indexOf(sp.servicePoint.servicePointId)
            if (idx > -1) {
                if (sp?.usage != null) {
                    ret.data.derRecords.push(...sp?.der);
                }
            }
        })
        return ret;
    }
    async getUsageForMultipleServicePoints(customerId: string, servicePointIds: string[]): Promise<any> {
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };
        let cust: any = await customers.findOne(query);
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        let ret: EnergyUsageListResponse = {
            data: {
                reads: []
            },
            links: l,
            meta: m
        }
        cust?.energy?.servicePoints?.forEach((sp: any) => {
            var idx = servicePointIds?.indexOf(sp.servicePoint.servicePointId)
            if (idx > -1) {
                if (sp?.usage != null) {
                    ret.data.reads.push(...sp?.usage);
                }
            }
        })
        return ret;
    }
    async getCustomerDetails(customerId: string): Promise<any> {
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };
        let cust: any = await customers.findOne(query);
        if (cust == null) return null;
        let response: ResponseCommonCustomerDetailV2 = {
            data: {
                customerUType: cust.customer.customerUType
            },
            links: {
                self: ""
            }
        }
        if (cust.customer.customerUType == "person") {
            response.data.person = cust.customer.person;
        }
        if (cust.customer.customerUType == "organisation") {
            response.data.organisation = cust.customer.organisation;
        }
        return response;

    }
    async getInvoicesForAccount(customerId: string, accountId: string): Promise<any> {
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };
        let cust: any = await customers.findOne(query);
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        let ret: EnergyInvoiceListResponse = {
            data: {
                invoices: []
            },
            links: l,
            meta: m
        }
        cust?.energy?.accounts?.forEach((acc: any) => {
            if (acc.account.accountId == accountId) {
                if (acc?.invoices != null) {
                    ret.data.invoices.push(...acc?.invoices);
                }
            }
        })
        return ret;
    }

    async getInvoicesForMultipleAccount(customerId: string, accountIds: string[]): Promise<any> {
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };
        let cust: any = await customers.findOne(query);
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        let ret: EnergyInvoiceListResponse = {
            data: {
                invoices: []
            },
            links: l,
            meta: m
        }
        cust?.energy?.accounts?.forEach((acc: any) => {
            if (accountIds.findIndex(acc.account.accountId) > -1) {
                if (acc?.invoices != null) {
                    ret.data.invoices.push(...acc.invoices);
                }
            }
        })
        return ret;
    }

    getConcesssionsForAccount(customerId: string, accountId: string): Promise<any> {
        throw new Error("Method not implemented.");
    }
    async getBalanceForAccount(customerId: string, accountId: string): Promise<any> {
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };
        let cust: any = await customers.findOne(query);
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        let ret: EnergyBalanceResponse = {
            data: {
                balance: ""
            },
            links: l,
            meta: m
        }
        cust?.energy?.accounts?.forEach((acc: any) => {
            if (acc.account.accountId == accountId) {
                ret.data.balance = acc.balance
            }
        })
        return ret;
    }

    getPaymentScheduleAccount(customerId: string, accountId: string): Promise<any> {
        throw new Error("Method not implemented.");
    }

    async getTransactionsForAccount(customerId: string, accountId: string): Promise<any> {
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };
        let cust: any = await customers.findOne(query);
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        let ret: EnergyBillingListResponseV2 = {
            data: {
                transactions: []
            },
            links: l,
            meta: m
        }
        cust?.energy?.accounts?.forEach((acc: any) => {
            if (acc.account.accountId == accountId) {
                if (acc?.invoices != null) {
                    ret.data.transactions.push(...acc?.transactions);
                }
            }
        })
        return ret;
    }

    async getUsageForServicePoint(customerId: string, servicePointId: string): Promise<any> {
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };
        let cust: any = await customers.findOne(query);
        let sp: any = cust?.energy?.servicePoints?.find((x: any) => x.servicePoint.servicePointId == servicePointId);

        let readData = sp?.usage as EnergyUsageRead[];

        let lk: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        let ret: EnergyUsageListResponse = {

            links: lk,
            meta: m,
            data: {
                reads: []
            }
        };
        ret.data.reads = (readData == undefined) ? [] : readData;
        return ret;
    }
    async getDerForServicePoint(customerId: string, servicePointId: string): Promise<any> {

        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };
        let cust: any = await customers.findOne(query);
        let sp: any = cust?.energy.servicePoints.find((x: any) => x.der.servicePointId == servicePointId);
        let data = sp?.der as EnergyDerRecord;
        let lk: Links = {
            self: ""
        }
        let m: Meta = {
        }
        let ret: EnergyDerDetailResponse = {
            data: data,
            links: lk,
            meta: m
        };
        return ret;
    }

    async getEnergyAccountDetails(customerId: string, accountId: string): Promise<any> {
        let ret: any = {};
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };
        let cust: any = await customers.findOne(query);
        let acc: any = cust?.energy.accounts.find((x: any) => x.account.accountId == accountId);
        ret.data = acc?.account;
        let l: Links = {
            self: ""
        }
        let m: Meta = {

        }
        ret.links = l;
        ret.meta = m;
        return ret;
    }

    async getServicePointDetails(customerId: string, servicePointId: string): Promise<any> {
        let ret: any = {};
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };
        let cust: any = await customers.findOne(query);
        let acc: any = cust?.energy.servicePoints.find((x: any) => x.servicePoint.servicePointId == servicePointId);
        ret.data = acc?.servicePoint ? acc?.servicePoint : [];
        let l: Links = {
            self: ""
        }
        let m: Meta = {

        }
        ret.links = l;
        ret.meta = m;
        return ret;
    }
    async loadCustomer(customer: any): Promise<boolean> {
        if (customer == null) return false;
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        let ret = await customers.insertOne(customer);
        return ret.insertedId != null

    }
    async getEnergyAccounts(customerId: string, accountIds: string[]): Promise<any> {
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        const query = { customerId: customerId };
        let cust: any = await customers.findOne(query);
        let accList: any[] = [];
        let accDetailList = cust?.energy?.accounts as EnergyAccountDetailV2[];
        if (accDetailList != null) {
            accDetailList.forEach((acc: any) => {
                let cnt = acc?.account?.plans?.length;
                let planList: any[] = [];
                for (let i = 0; i < cnt; i++) {
                    
                    let newPlan: any = {
                        nickname: acc.account?.plans[i]?.nickname,
                        servicePointIds: []
                    }
                    if (acc.account?.openStatus == null || acc.account?.openStatus == 'OPEN')
                        newPlan.planOverview = acc.account?.plans[i]?.planOverview;
                    if (acc.account?.plans[i]?.servicePointsIds)
                        newPlan.servicePointIds = acc.account?.plans[i]?.servicePointsIds
                    planList.push(newPlan);
                }
                let newAccount: EnergyAccount = {
                    plans: planList,
                    accountNumber: acc.account?.accountNumber,
                    accountId: acc.account?.accountId,
                    displayName: acc.account?.displayName,
                    openStatus: acc.account?.openStatus,
                    creationDate: acc.account?.creationDate as string
                }
                accList.push(newAccount);
            })
        }

        let lk: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }

        let listResponse: any = {
            data: {
                accounts: accList
            },
            links: lk,
            meta: m
        }

        return listResponse;

    }

    async getLoginInformation( sector: string): Promise<CustomerModel[] | undefined> {
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        var loginModel : CustomerModel[] = [];
        let cursor = await customers.find().toArray();

        for (let cnt = 0; cnt < cursor.length; cnt++){
            let aModel: CustomerModel = {
                LoginId: "",
                Accounts: []
            };
            aModel.LoginId = `${cursor[cnt].customer?.person?.lastName}.${cursor[cnt].customer?.person?.firstName}`;
            let accounts: AccountModel [] = [];
            if (sector.toLowerCase() == 'energy') {
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
            if (sector.toLowerCase() == 'banking') {
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

    async getUserForLoginId(loginId: string, userType: string): Promise<string| undefined>{
        // split login name to find first and last name
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        let arr: string[] = loginId.split('.');
        if (arr.length < 2)
            return undefined;
        let firstName = arr[1];
        let lastName = arr[0];
        const query = { firstName: firstName, lastName: lastName };
        let cust: any = await customers.findOne(query);
        return cust?.customerId;
    }

    async getServicePointsForCustomer(customerId: string): Promise<string[] | undefined> {
        throw new Error("Method not implemented.");
    }
}


