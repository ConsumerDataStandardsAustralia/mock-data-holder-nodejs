import { LinksPaginated, MetaPaginated } from "consumer-data-standards/banking";
import { ResponseCommonCustomerDetailV2 } from "consumer-data-standards/common";
import { EnergyAccount, EnergyAccountDetailV2, EnergyAccountListResponseV2, EnergyBalanceListResponse, EnergyBalanceResponse, EnergyBillingListResponse, EnergyConcession, EnergyConcessionsResponse, EnergyDerDetailResponse, EnergyDerListResponse, EnergyDerRecord, EnergyInvoice, EnergyInvoiceListResponse, EnergyPaymentSchedule, EnergyPaymentScheduleResponse, EnergyPlan, EnergyServicePoint, EnergyServicePointDetail, EnergyServicePointListResponse, EnergyUsageListResponse, EnergyUsageRead, Links, Meta } from "consumer-data-standards/energy";
import * as mongoDB from "mongodb";
import { IDatabase } from "./database.interface";
import { devNull } from "os";
import { Service } from "typedi";

@Service()
export class SingleData implements IDatabase {

    public collections: mongoDB.Collection[] = [];
    private client: mongoDB.MongoClient;
    private dsbData: mongoDB.Db;
    private dsbName: string;

    constructor(connString: string, dbName: string) {
        this.client = new mongoDB.MongoClient(connString, { monitorCommands: true });
        this.dsbName = dbName;
        this.dsbData = this.client.db(dbName);
    }

    async getUserForLoginId(loginId: string, userType: string): Promise<string| undefined> {
        // split loginId into first and last name
        var customerId;
        let arr: string[] = loginId.split('.');
        if (arr.length < 2)
            return undefined;
        let firstName = arr[1];
        let lastName = arr[0];
        let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let allData = await allDataCollection.findOne();
        if (allData?.holders != undefined) {
            let allCustomers = allData?.holders[0]?.holder?.authenticated?.customers;
            if (allCustomers.length < 1)
                return undefined;
            allCustomers.forEach( (c: any) => {
                if (c?.customer?.person?.firstName.toUpperCase() == firstName.toUpperCase()
                && c?.customer?.person?.lastName.toUpperCase() == lastName.toUpperCase()) {
                    customerId = c.customerId;
                }
            })
            //let cust = allCustomers?.find(((x: any) => x.customer.person.firstName == firstName && x.customer.person.lastName == lastName));
           // return cust;       
        } 
        return customerId;
    }

    async getCustomer(allDataCollection: mongoDB.Collection, customerId: string): Promise<any> {
        let allData = await allDataCollection.findOne();
        if (allData?.holders != undefined) {
            let allCustomers = allData?.holders[0]?.holder?.authenticated?.customers;
            let cust = allCustomers?.find(((x: any) => x.customerId == customerId));
            return cust;       
        } else {
            return null;
        }
    }

    async getPlans(allDataCollection: mongoDB.Collection, query : any): Promise<any> {
        let allData = await allDataCollection.findOne();
        let allPlans = null;
        if (allData?.holders != null)
            allPlans = allData?.holders[0]?.holder?.unauthenticated?.energy?.plans;
        if (query != null) {

        }
        return allPlans;
    }

    async getBalancesForMultipleAccount(customerId: string, accountIds: string[]): Promise<any> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        let balances: any[] = [];

        if (cust != null) {
            cust?.energy?.accounts?.forEach((acc: any) => {
                var idx = accountIds?.indexOf(acc.account.accountId)
                if (idx > -1) {
                    if (acc?.balance != null) {
                        let balance: any = {
                            balance: acc.balance.balance,
                            accountId: acc.account.accountId
                        }
                        balances.push(balance);
                    }
                }
            })
        }
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
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);

        let retArray: any[] = [];
        if (cust != null) {
            cust?.energy?.servicePoints?.forEach((sp: any) => {
                if (sp?.usage != null) {
                    retArray.push(...sp?.usage);
                }
            })
        }


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
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);

        let retArray: any[] = [];
        if (cust != null) {
            cust?.energy?.servicePoints?.forEach((sp: any) => {
                if (sp?.der != null) {
                    retArray.push(sp?.der);
                }
            })
        }

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
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let retArray: any[] = [];
        if (cust != null) {
            cust?.energy?.accounts.forEach((acc: any) => {
                retArray.push(...acc?.transactions)
            });
        }

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
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        let balances: any[] = [];
        if (cust != null) {
            cust?.energy?.accounts?.forEach((acc: any) => {

                if (acc?.balance != null) {
                    let balance: any = {
                        balance: acc.balance.balance,
                        accountId: acc.account.accountId
                    }
                    balances.push(balance);
                }
            })
        }
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
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let retArray: any[] = [];
        if (cust != null) {
            cust?.energy?.accounts.forEach((acc: any) => {
                retArray.push(...acc?.invoices)
            });
        }
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
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let allPlans: any = await this.getPlans(allData, undefined);
        let retArray: any[] = [];
        if (allPlans == null) {
            ret.data = { plans: retArray };
        } else {
            await allPlans.forEach((p: EnergyPlan) =>
                retArray.push(p));
            ret.data = { plans: retArray };
        }

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
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        const query = { planId: planId };
        let plan: any = await this.getPlans(allData, query);

        if (plan == null)
            return null;
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
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
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
        if (cust != null) {
            cust?.energy?.accounts?.forEach((acc: any) => {
                if (acc.account.accountId == accountId) {
                    if (acc?.concessions != null) {
                        ret.data.concessions.push(...acc?.concessions);
                    }
                }
            })
        }
        return ret;
    }
    async getPaymentSchedulesForAccount(customerId: string, accountId: string): Promise<any> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
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
        if (cust != null) {
            cust?.energy?.accounts?.forEach((acc: any) => {
                if (acc.account.accountId == accountId) {
                    if (acc?.paymentSchedule != null) {
                        ret.data.paymentSchedules.push(...acc?.paymentSchedule);
                    }
                }
            })
        }
        return ret;
    }
    async getServicePoints(customerId: string): Promise<any> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
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
        if (cust != null) {
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
        }
        return ret;
    }

    async getBillingForMultipleAccounts(customerId: string, accountIds: string[]): Promise<any> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        let ret: EnergyBillingListResponse = {
            data: {
                transactions: []
            },
            links: l,
            meta: m
        }
        if (cust != null) {
            cust?.energy?.accounts?.forEach((acc: any) => {
                var idx = accountIds?.indexOf(acc.account.accountId)
                if (idx > -1) {
                    if (acc?.invoices != null) {
                        ret.data.transactions.push(...acc?.transactions);
                    }
                }
            })
        }
        return ret;
    }
    async getInvoicesForMultipleAccounts(customerId: string, accountIds: string[]): Promise<any> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
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
        if (cust != null) {
            cust?.energy?.accounts?.forEach((acc: any) => {
                var idx = accountIds?.indexOf(acc.account.accountId)
                if (idx > -1) {
                    if (acc?.invoices != null) {
                        ret.data.invoices.push(...acc?.invoices);
                    }
                }
            })
        }
        return ret;
    }
    async getDerForMultipleServicePoints(customerId: string, severvicePointIds: string[]): Promise<any> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
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
        if (cust != null) {
            cust?.energy?.servicePoints?.forEach((sp: any) => {
                var idx = severvicePointIds?.indexOf(sp.servicePoint.servicePointId)
                if (idx > -1) {
                    if (sp?.usage != null) {
                        ret.data.derRecords.push(...sp?.der);
                    }
                }
            })
        }
        return ret;
    }
    async getUsageForMultipleServicePoints(customerId: string, servicePointIds: string[]): Promise<any> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
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
        if (cust != null) {
            cust?.energy?.servicePoints?.forEach((sp: any) => {
                var idx = servicePointIds?.indexOf(sp.servicePoint.servicePointId)
                if (idx > -1) {
                    if (sp?.usage != null) {
                        ret.data.reads.push(...sp?.usage);
                    }
                }
            })
        }

        return ret;
    }
    async getCustomerDetails(customerId: string): Promise<any> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
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
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
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
        if (cust != null) {
            cust?.energy?.accounts?.forEach((acc: any) => {
                if (acc.account.accountId == accountId) {
                    if (acc?.invoices != null) {
                        ret.data.invoices.push(...acc?.invoices);
                    }
                }
            })
        }
        return ret;
    }

    async getInvoicesForMultipleAccount(customerId: string, accountIds: string[]): Promise<any> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
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
        if (cust != null) {
            cust?.energy?.accounts?.forEach((acc: any) => {
                if (accountIds.findIndex(acc.account.accountId) > -1) {
                    if (acc?.invoices != null) {
                        ret.data.invoices.push(...acc.invoices);
                    }
                }
            })
        }
        return ret;
    }

    getConcesssionsForAccount(customerId: string, accountId: string): Promise<any> {
        throw new Error("Method not implemented.");
    }
    async getBalanceForAccount(customerId: string, accountId: string): Promise<any> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
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
        if (cust != null) {
            cust?.energy?.accounts?.forEach((acc: any) => {
                if (acc.account.accountId == accountId) {
                    ret.data.balance = acc.balance.balance
                }
            })
        }
        return ret;
    }

    getPaymentScheduleAccount(customerId: string, accountId: string): Promise<any> {
        throw new Error("Method not implemented.");
    }

    async getTransactionsForAccount(customerId: string, accountId: string): Promise<any> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let l: LinksPaginated = {
            self: ""
        }
        let m: MetaPaginated = {
            totalPages: 0,
            totalRecords: 0
        }
        let ret: EnergyBillingListResponse = {
            data: {
                transactions: []
            },
            links: l,
            meta: m
        }
        if (cust != null) {
            cust?.energy?.accounts?.forEach((acc: any) => {
                if (acc.account.accountId == accountId) {
                    if (acc?.invoices != null) {
                        ret.data.transactions.push(...acc?.transactions);
                    }
                }
            })
        }
        return ret;
    }

    async getUsageForServicePoint(customerId: string, servicePointId: string): Promise<any> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
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
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
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
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
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
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
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
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let ret = await customers.insertOne(customer);
        return ret.insertedId != null

    }
    async getEnergyAccounts(customerId: string): Promise<any> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
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

    async connectDatabase() {
        try {
            await this.client.connect();
            this.dsbData = this.client.db(this.dsbName);
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


