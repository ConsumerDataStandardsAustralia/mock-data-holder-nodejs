import { BankingAccountDetailV3, BankingAccountV2, BankingBalance, BankingDirectDebit, BankingPayeeDetailV2, BankingPayeeV2, 
    BankingProductDetailV4, BankingProductV4, BankingScheduledPaymentV2, 
    BankingTransaction, 
    BankingTransactionDetail, 
    LinksPaginated, MetaPaginated } from "consumer-data-standards/banking";
import { ResponseCommonCustomerDetailV2 } from "consumer-data-standards/common";
import { EnergyAccountDetailV3, EnergyAccountV2,  EnergyBillingTransactionV3, EnergyConcession,  
    EnergyDerRecord, EnergyInvoice, EnergyPaymentSchedule, EnergyPlan, EnergyPlanDetailV2, 
    EnergyServicePoint, EnergyServicePointDetail, EnergyUsageRead,
    Links,
    Meta} from "consumer-data-standards/energy";
import * as mongoDB from "mongodb";
import { IEnergyData } from "./database-energy.interface";
import { Service } from "typedi";
import { AccountModel, CustomerModel } from "../models/login";
import { QueryRange } from "../models/query-range";
import { IDatabase } from "./database.interface";

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

    checkAccount(acc: any) {

    }
    // ********************** BANKING implementation *******************************
    async getAccounts(customerId: string, accountIds: string[], query: any): Promise<BankingAccountV2[]> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let accList: BankingAccountV2[] = [];
        let accDetailList = cust?.banking?.accounts as BankingAccountDetailV3[];
        let openStatus = query["open-status"];
        let category: string | null = null;
        let isowned: boolean | null = null;
        if (query["product-category"] != null) {
            category = query["product-category"].toUpperCase();
        }
        if (query["is-owned"] != null) {
            isowned = query["is-owned"] === "true";
        }


        if (accDetailList != null) {
            accDetailList.forEach((acc: any) => {
                //let cnt = acc?.account?.plans?.length;
                if ( 
                    // condition 1
                    ((openStatus == null) 
                        || (openStatus.toUpperCase() == "ALL")
                        || (acc.account?.openStatus?.toUpperCase() == openStatus?.toUpperCase())
                    )
                    &&
                    // condition 2
                    (accountIds?.length > 0 && accountIds.indexOf(acc?.account?.accountId) > -1)
                    &&
                    // condition 3
                    (category == null  
                        || (category == acc.account?.productCategory.toUpperCase()))
                    &&
                    // condition 4
                    (
                        (isowned == null)
                            ||
                        (acc.account?.isOwned == isowned)
                        ||
                        (acc.account?.isOwned == null && isowned == true)
                        )
                ) {

                            let newAccount: BankingAccountV2 = {

                                accountId: acc.account?.accountId,
                                creationDate: acc.account?.creationDate as string,
                                displayName: acc.account?.displayName,
                                openStatus: acc.account?.openStatus,
                                isOwned: acc.account?.isOwned,
                                accountOwnership: acc.account?.accountOwnership,
                                maskedNumber: acc.account?.maskedNumber,
                                productCategory: acc.account?.productCategory,
                                productName: acc.account?.productName
                            }
                            accList.push(newAccount);
                        }
                    
                
            })
        }
        return accList;
    }

    async getAccountDetail(customerId: string, accountId: string): Promise<BankingAccountDetailV3 | undefined> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let acc: any = cust?.banking.accounts.find((x: any) => x.account.accountId == accountId);
        return acc?.account as BankingAccountDetailV3;
    }
    async getTransationsForAccount(customerId: string, accountId: string, query: any): Promise<BankingTransaction[]> {
        let account: any;
        let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
        let retArray : BankingTransaction[] = [];
        let mSecInDay = 86400000;
        let minAmount: number | null = null;
        let maxAmount: number | null = null;
        let customer = await this.getCustomer(allDataCollection, customerId);
        let range: QueryRange = this.getDateRangeFromQueryParams(query, "oldest-time", "newest-time");
        if (query["oldest-time"] == null)
            range.startRange = range.endRange - 90*mSecInDay;
        if (query["min-amount"] != null)
            minAmount = parseFloat(query["min-amount"])
        if (query["max-amount"] != null)
            maxAmount = parseFloat(query["max-amount"])        
        account = customer?.banking?.accounts.find((x: any) => {
            if (x.account.accountId == accountId)
                return x;
        })
        //customer?.banking?.accounts.forEach((acc: any) => {
            account?.transactions.filter((tr: BankingTransactionDetail) => {
                let refDate = range.startRange;
                if (tr.executionDateTime != null)
                    refDate = Date.parse(tr.executionDateTime);
                if (tr.valueDateTime != null)
                    refDate = Date.parse(tr.valueDateTime); 
                if (tr.postingDateTime != null)
                    refDate = Date.parse(tr.postingDateTime);
               
                if ((isNaN(refDate) || (refDate >= range.startRange && refDate <= range.endRange))
                    && (minAmount == null || parseFloat(tr.amount) >= minAmount)
                    && (maxAmount == null || parseFloat(tr.amount) <= maxAmount))
                    retArray.push(tr)
            })
        return retArray;
    }
    async getTransactionDetail(customerId: string, accountId: string, transactionId: string): Promise<BankingTransactionDetail | undefined> {
        let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
        let customer = await this.getCustomer(allDataCollection, customerId);
        let account = customer?.banking?.accounts.find((x: any) => {
            if (x?.account?.accountId == accountId)
                return x;
        });

        let transaction = account?.transactions.find((x: any) => {
            if (x?.transactionId == transactionId)
                return x;
        });
        return transaction;
    }
    async getBulkBalances(customerId: string, query: any): Promise<BankingBalance[]> {

        let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
        let customer = await this.getCustomer(allDataCollection, customerId);
        let openStatus = query["open-status"];
        let category: string | null = null;
        let isowned: boolean | null = null;
        if (query["product-category"] != null) {
            category = query["product-category"].toUpperCase();
        }
        if (query["is-owned"] != null) {
            isowned = query["is-owned"] === "true";
        }
        let retArray: BankingBalance[] = [];
        customer?.banking?.accounts.forEach((acc: any) => {
            let account : BankingAccountDetailV3 = acc.account;
            if ((category == null || account.productCategory == category)
                && (openStatus == null || account.openStatus == openStatus)
                    // condition 4
                &&    (
                        (isowned == null)
                            ||
                        (acc.account?.isOwned == isowned)
                        ||
                        (acc.account?.isOwned == null && isowned == true)
                        )
            )
                retArray.push(acc.balance)
        })

        return retArray;
    }
    async getAccountBalance(customerId: string, accountId: string): Promise<BankingBalance | undefined> {
        let ret: any = {};
        let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
 
        let customer = await this.getCustomer(allDataCollection, customerId);

        if (customer?.banking?.accounts == null) {
            ret.data = { };
        } else { 

            let accounts =  customer?.banking?.accounts.find((x:any) => x.account?.accountId == accountId)
            ret.data = accounts?.balance;
        }
        let l: Links = {
            self: ""
        }
        let m: Meta= {}
        ret.links = l;
        ret.meta = m;
        return ret;
    }
    async getBalancesForSpecificAccounts(customerId: string, accountIds: string[], query: any): Promise<BankingBalance[]> {
        let ret: any = {};
        let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
 
        let customer = await this.getCustomer(allDataCollection, customerId);
        let retArray: BankingBalance[] = [];
        if (customer?.banking?.accounts == null) {
            ret.data = { balances: retArray };
        } else { 
            let accounts: any[] = [];
            accountIds.forEach((id: string) => {
                accounts = customer?.banking?.accounts.filter((x: any) => {
                    if (x.account?.accountId == id && x?.balance != null) {
                        retArray.push(x.balance);
                    }
                        
                })
            })
            ret.data = { balances: retArray };
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
    
    async getDirectDebitsForAccount(customerId: string, accountId: string, query: any): Promise<BankingDirectDebit[]> {
        let ret: any = {};
        let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);

        let customer = await this.getCustomer(allDataCollection, customerId);
        let retArray: BankingDirectDebit[] = [];
        if (customer?.banking?.directDebits == null) {
            ret.data = { directDebitAuthorisations: retArray };
        } else {
            let debits = customer?.banking?.directDebits.filter((x: any) => {
                if (x.accountId == accountId)
                    return x;
            })
  
            ret.data = { directDebitAuthorisations: debits };
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
    async getDirectDebitsForAccountList(customerId: string, accountIds: string[], query: any): Promise<BankingDirectDebit[]> {
        let ret: any = {};
        let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
 
        let customer = await this.getCustomer(allDataCollection, customerId);
        let retArray: BankingDirectDebit[] = [];
        if (customer?.banking?.directDebits == null) {
            ret.data = { directDebitAuthorisations: retArray};
        } else { 
            let debits: any[] = [];
            accountIds.forEach((id: string) => {
                debits = customer?.banking?.directDebits.filter((x: any) => {
                    if (x?.accountId == id) {
                        retArray.push(x);
                    }
                        
                })
            })
            ret.data = { directDebitAuthorisations: retArray };
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
    async getBulkDirectDebits(customerId: string, query: any): Promise<BankingDirectDebit[]> {
        let ret: any = {};
        let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
 
        let customer = await this.getCustomer(allDataCollection, customerId);
        let retArray: BankingDirectDebit[] = [];
        if (customer?.banking?.directDebits == null) {
            ret.data = { directDebitAuthorisations: retArray };
        } else { 
            ret.data = { directDebitAuthorisations: customer?.banking?.directDebits };
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

    async getScheduledPaymentsForAccount(customerId: string, accountId: string, query: any): Promise<BankingScheduledPaymentV2[]> {
        let ret: any = {};
        let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);

        let customer = await this.getCustomer(allDataCollection, customerId);
        let retArray: BankingScheduledPaymentV2[] = [];
        if (customer?.banking?.payments == null) {
            ret.data = { scheduledPayments: retArray };
        } else {
            let payments = customer?.banking?.payments.filter((x: any) => {
                if (x.from.accountId == accountId)
                    return x;
            })
  
            ret.data = { scheduledPayments: payments };
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

    async getScheduledPaymentsForAccountList(customerId: string, accountIds: string[], query: any): Promise<BankingScheduledPaymentV2[]> {
        let ret: any = {};
        let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
 
        let customer = await this.getCustomer(allDataCollection, customerId);
        let retArray: BankingScheduledPaymentV2[] = [];
        if (customer?.banking?.payments == null) {
            ret.data = { scheduledPayments: retArray};
        } else { 
            let payments: any[] = [];
            accountIds.forEach((id: string) => {
                payments = customer?.banking?.payments.filter((x: any) => {
                    if (x.from?.accountId == id) {
                        retArray.push(x);
                    }
                        
                })
            })
            ret.data = { scheduledPayments: retArray };
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

    async getBulkScheduledPayments(customerId: string, query: any): Promise<BankingScheduledPaymentV2[]> {
        let ret: any = {};
        let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
 
        let customer = await this.getCustomer(allDataCollection, customerId);
        let retArray: BankingScheduledPaymentV2[] = [];
        if (customer?.banking?.payments == null) {
            ret.data = { scheduledPayments: retArray };
        } else {     
            ret.data = { scheduledPayments: customer?.banking?.payments };
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

    async getPayees(customerId: string, query: any): Promise<BankingPayeeV2[]> {
        let ret: any = {};
        let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);

        let customer = await this.getCustomer(allDataCollection, customerId);
        let retArray: BankingPayeeV2[] = [];
        if (customer?.banking?.payees == null) {
            ret.data = { payees: retArray };
        } else {
            customer?.banking?.payees.forEach((p: BankingPayeeDetailV2) => {
                let payee: BankingPayeeV2 = {
                    nickname: p.nickname,
                    payeeId: p.payeeId,
                    type: p.type
                } ;
                if (p.creationDate != null ) payee.creationDate = p.creationDate;
                if (p.description != null ) payee.description = p.description;

                retArray.push(payee);      
            });       
            ret.data = { payees: retArray };
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

    async getPayeeDetail(customerId: string, payeeId: string): Promise<BankingPayeeDetailV2 | undefined> {
        let ret: any = {};
        let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);

        let customer = await this.getCustomer(allDataCollection, customerId);
        //let retArray: BankingAccountV2[] = [];
        if (customer?.banking?.payees == null) {
            return undefined;
        } else {
            let payees = customer?.banking?.payees.filter((x: BankingPayeeDetailV2) => {
                if (x.payeeId == payeeId)
                    return x;
            })
            if (payees?.length > 0)
                ret.data = payees[0];
            else
                return undefined;
        }

        let l: Links = {
            self: ""
        }
        let m: Meta= {}
        ret.links = l;
        ret.meta = m;
        return ret;
    }

    async getAllBankingProducts(query: any): Promise<BankingProductV4[]> {
        let ret: any = {};
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
        let allPlans: any = await this.getProducts(allData, undefined);

        let retArray: any[] = [];
        if (allPlans == null) {
            ret.data = { products: retArray };
        } else {
            await allPlans.forEach((p: BankingProductDetailV4) => {
                let product: BankingProductV4 = {
                    brand: p.brand,
                    description: p.description,
                    isTailored: p.isTailored,
                    lastUpdated: p.lastUpdated,
                    name: p.name,
                    productCategory: p.productCategory,
                    productId: p.productId
                } ;
                if (p.additionalInformation != null ) product.additionalInformation = p.additionalInformation;
                if (p.effectiveFrom != null ) product.effectiveFrom = p.effectiveFrom;
                if (p.effectiveTo != null ) product.effectiveFrom = p.effectiveTo;
                if (p.brandName != null ) product.brandName = p.brandName;
                if (p.applicationUri != null) product.applicationUri = p.applicationUri;
                if (p.cardArt != null) product.cardArt = p.cardArt;
                retArray.push(product);      
            });       
            ret.data = { products: retArray };
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

    async getBankingProductDetails(productId: string): Promise<BankingProductDetailV4 | undefined> {
        let ret: any = {};
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
        // const query = { productId: productId };
        let product: any = await this.getProducts(allData, productId);

        if (product == null || product.length == 0)
            return undefined;

        ret.data = product[0];
        let l: Links = {
            self: ""
        }
        let m: Meta = {

        }
        ret.links = l;
        ret.meta = m;
        return ret;
    }

    async getProducts(allDataCollection: mongoDB.Collection, productId: string | undefined): Promise<any> {
        let allData = await allDataCollection.findOne();
        let allProducts = null;
        if (allData?.holders != null)
            allProducts = allData?.holders[0]?.holder?.unauthenticated?.banking?.products;
        if (productId != null) {
            allProducts = allData?.holders[0]?.holder?.unauthenticated?.banking?.products.filter((x: any) => {
                if (x.productId == productId)
                    return x;
            })
        } 
        return allProducts;
    }

    async getPayeeList(allDataCollection: mongoDB.Collection, productId: string | undefined): Promise<any> {
        let allData = await allDataCollection.findOne();
        let allProducts = null;
        if (allData?.holders != null)
            allProducts = allData?.holders[0]?.holder?.unauthenticated?.banking?.products;
        if (productId != null) {
            allProducts = allData?.holders[0]?.holder?.unauthenticated?.banking?.products.filter((x: any) => {
                if (x.productId == productId)
                    return x;
            })
        } 
        return allProducts;
    } 

    async getPayeesForCustomer(customerId: string): Promise<string[] | undefined> {
        let ret: string[] = [];
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let allPayees: any = cust?.banking.payees;
        allPayees.forEach((p: any) => {
            ret.push(p.payeeId)
        })
        return ret;
    }

    // Login information
    async getUserForLoginId(loginId: string, userType: string): Promise<string | undefined> {
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
            allCustomers.forEach((c: any) => {
                if (c?.customer?.person?.firstName.toUpperCase() == firstName.toUpperCase()
                    && c?.customer?.person?.lastName.toUpperCase() == lastName.toUpperCase()) {
                    customerId = c.customerId;
                }
            })
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

    // ********************** ENERGY implementation *******************************
    private async getPlans(allDataCollection: mongoDB.Collection, query: any): Promise<any> {
        /*
                type	 Enum 
                Used to filter results on the type field. Any one of the valid values for this field can be supplied plus 'ALL'. If absent defaults to 'ALL'
                
                fuelType Enum
                Used to filter results on the fuelType field. Any one of the valid values for this field can be supplied plus 'ALL'. If absent defaults to 'ALL'
                
                effective   Enum
                Allows for the filtering of plans based on whether the current time is within the period of time defined as effective by the effectiveFrom and effectiveTo fields. Valid values are ‘CURRENT’, ‘FUTURE’ and ‘ALL’. If absent defaults to 'CURRENT'
                
                updated-since DateTimeString
                Only include plans that have been updated after the specified date and time. If absent defaults to include all plans
                
                brand string
                Used to filter results on the brand field. If absent defaults to include all plans
        */

        let allData: mongoDB.WithId<mongoDB.Document> | null = await allDataCollection.findOne();

        let allPlans: any;
        let retPlans = null;
        var refToDate = Number.MAX_VALUE;
        var refFromDate = 0;
        if (query["effective"] != null && (query["effective"].toUpperCase() == "FUTURE")) {
            refFromDate = Date.now();
            refToDate = Number.MAX_VALUE;
        }
        if (query["effective"] != null && (query["effective"].toUpperCase() == "CURRENT")) {
            refToDate = Date.now();
        }
        // filter out the expired plans
        if (allData?.holders != null) {
            allPlans = allData?.holders[0]?.holder?.unauthenticated?.energy?.plans
                .filter((x: any) => {
                    var refDate = Date.parse(x.effectiveTo);
                    if (refDate >= refFromDate && refDate <= refToDate) {
                        return x;
                    }
                });
        }
        if (query != null) {
            retPlans = allPlans.filter((p: any) => {
                if (
                    (query.fuelType == null || query.fuelType.toUpperCase() == 'ALL' || query.fuelType.toUpperCase() == p?.fuelType.toUpperCase())
                    && (query.type == null || query.type.toUpperCase() == 'ALL' || query.type.toUpperCase() == p?.type.toUpperCase())
                    && (query["update-since"] == null || Date.parse(query["update-since"]) < Date.parse(p.lastUpdated))
                    && (query["brand"] == null || query["brand"].toUpperCase() === p.brand.toUpperCase())) {
                    return p;
                }
            });
        }
        return retPlans;
    }

    async getBalancesForMultipleAccount(customerId: string, accountIds: string[]): Promise<any[]> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let balances: any[] = [];
        let cust: any = await this.getCustomer(allData, customerId);

        if (cust != null) {
            cust?.energy?.accounts?.forEach((acc: any) => {
                var idx = accountIds?.indexOf(acc.account.accountId)
                if (idx > -1) {
                    if (acc?.balance != null) {
                        let balance: any = {
                            balance: acc.balance,
                            accountId: acc.account.accountId
                        }
                        balances.push(balance);
                    }
                }
            })
        }
        return balances;
    }
    async getBulkUsageForUser(customerId: string, query: any): Promise<EnergyUsageRead[]> {
        let ret: any = {};
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let filteredUsage: EnergyUsageRead[] = [];
        if (cust != null) {
            let range: QueryRange = this.getDateRangeFromQueryParams(query, "oldest-date", "newest-date");
            // interval reads
            var intervalReads = "NONE";
            if (query["interval-reads"] != null) {
                intervalReads = query["interval-reads"];
            }
            cust?.energy?.servicePoints?.forEach((sp: any) => {
                if (sp?.usage != null) {

                    sp.usage.filter((u: any) => {
                        let refDate = Date.parse(u.readStartDate);
                        if (isNaN(refDate) || (refDate >= range.startRange && refDate <= range.endRange))
                            filteredUsage.push(u)
                        else
                            console.log(`Not added ${u?.readStartDate}`)
                    })
                }
            })
        }
        return filteredUsage;
    }
    async getBulkDerForUser(customerId: string): Promise<EnergyDerRecord[]> {
        let ret: EnergyDerRecord[] = [];
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);

        if (cust != null) {
            cust?.energy?.servicePoints?.forEach((sp: any) => {
                if (sp?.der != null) {
                    ret.push(sp?.der);
                }
            })
        }
        return ret;
    }

    async getBulkBilllingForUser(customerId: string, query: any): Promise<EnergyBillingTransactionV3[]> {
        let ret: any = {};
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let retArray: EnergyBillingTransactionV3[] = [];
        if (cust != null) {
            let range: QueryRange = this.getDateRangeFromQueryParams(query, "oldest-time", "newest-time");
            cust?.energy?.accounts.forEach((acc: any) => {
                acc?.transactions.filter((tr: any) => {
                    let refDate = Date.parse(tr.executionDateTime);
                    if (isNaN(refDate) || (refDate >= range.startRange && refDate <= range.endRange))
                        retArray.push(tr)
                })
            });
        }
        return retArray;
    }

    async getBulkBalancesForUser(customerId: string): Promise<any[]> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let balances: any[] = [];
        if (cust != null) {
            cust?.energy?.accounts?.forEach((acc: any) => {
                if (acc?.balance != null) {
                    let balance: any = {
                        balance: acc.balance,
                        accountId: acc.account.accountId
                    }
                    balances.push(balance);
                }
            })
        }
        return balances;
    }
    async getBulkInvoicesForUser(customerId: string, query: any): Promise<EnergyInvoice[]> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let filteredInvoices: EnergyInvoice[] = [];

        if (cust != null) {
            let range: QueryRange = this.getDateRangeFromQueryParams(query, "oldest-date", "newest-date");
            cust?.energy?.accounts?.forEach((acc: any) => {
                if (acc?.invoices != null) {
                    acc?.invoices.filter((inv: any) => {
                        let refDate = Date.parse(inv.issueDate);
                        if (isNaN(refDate) || (refDate >= range.startRange && refDate <= range.endRange))
                            filteredInvoices.push(inv)
                        else
                            console.log(`Not added ${inv?.issueDate}`)
                    })
                }
            })
        }
        return filteredInvoices;
    }

    async getEnergyAllPlans(query: any): Promise<EnergyPlan[]> {
        let ret: any = {};
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let allPlans: EnergyPlan[] = await this.getPlans(allData, query);
        let retArray: EnergyPlan[] = [];
        if (allPlans == null) {
            ret.data = { plans: retArray };
        } else {
            await allPlans.forEach((p: EnergyPlan) =>
                retArray.push(p));
        }
        return retArray;
    }
    async getEnergyPlanDetails(planId: string): Promise<EnergyPlanDetailV2 | null> {

        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        const query = { planId: planId };
        let plans: EnergyPlanDetailV2[] = await this.getPlans(allData, query);
        if (plans.length > 0)
            return plans[0];
        else
            return null;
    }
    async getConcessionsForAccount(customerId: string, accountId: string): Promise<EnergyConcession[] | undefined> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let concessions: EnergyConcession[] = [];
        if (cust != null) {
            cust?.energy?.accounts?.forEach((acc: any) => {
                if (acc.account.accountId == accountId) {
                    if (acc?.concessions != null) {
                        concessions?.push(acc?.concessions);
                    }
                }
            })
        }
        return concessions;
    }
    async getPaymentSchedulesForAccount(customerId: string, accountId: string): Promise<EnergyPaymentSchedule[]> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let ret: EnergyPaymentSchedule[] = [];
        if (cust != null) {
            cust?.energy?.accounts?.forEach((acc: any) => {
                if (acc.account.accountId == accountId) {
                    if (acc?.paymentSchedule != null) {
                        ret.push(...acc?.paymentSchedule);
                    }
                }
            })
        }
        return ret;
    }
    async getServicePoints(customerId: string): Promise<EnergyServicePoint[]> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);

        let spList: EnergyServicePoint[] = [];
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
            }
        }
        return spList;
    }

    async getBillingForMultipleAccounts(customerId: string, accountIds: string[], query: any): Promise<EnergyBillingTransactionV3[]> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);

        let range: QueryRange = this.getDateRangeFromQueryParams(query, "oldest-time", "newest-time");
        let filteredBilling: EnergyBillingTransactionV3[] = [];
        if (cust != null) {
            cust?.energy?.accounts?.forEach((acc: any) => {
                var idx = accountIds?.indexOf(acc.account.accountId)
                if (idx > -1) {
                    if (acc?.transactions != null) {
                        acc?.transactions.forEach((tr: EnergyBillingTransactionV3) => {
                            if (Date.parse(tr.executionDateTime) >= range.startRange && Date.parse(tr.executionDateTime) <= range.endRange) {
                                {
                                    filteredBilling.push(tr);
                                }
                            }
                        })
                    }
                }
            })
        }
        return filteredBilling;
    }

    async getDerForMultipleServicePoints(customerId: string, severvicePointIds: string[]): Promise<EnergyDerRecord[]> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let ret: EnergyDerRecord[] = [];
        if (cust != null) {
            cust?.energy?.servicePoints?.forEach((sp: any) => {
                var idx = severvicePointIds?.indexOf(sp.servicePoint.servicePointId)
                if (idx > -1) {
                    if (sp?.der != null) {
                        ret.push(sp?.der);
                    }
                }
            })
        }
        return ret;
    }

    getDateRangeFromQueryParams(query: any, paramNameStart: string, paramNameEnd: string): QueryRange {

        let mSecInYear = 31536000000;
        // check newest time
        var newestTime = Date.now();
        //const newTime: any = currentDate.getMilliseconds();
        if (query[paramNameEnd] != null && isNaN(Date.parse(query[paramNameEnd])) == false) {
            newestTime = Date.parse(query[paramNameEnd]);
        }
        var oldestTime = newestTime - mSecInYear;
        // check oldest time
        if (query[paramNameStart] != null && isNaN(Date.parse(query[paramNameStart])) == false) {
            oldestTime = Date.parse(query[paramNameStart]);
        }
        let retVal: QueryRange = {
            startRange: oldestTime,
            endRange: newestTime
        };
        return retVal;
    }
    compareByStartDate(a: any, b: any) {
        return a.readStartDate.localeCompare(b.readStartDate);
    }

    async getUsageForMultipleServicePoints(customerId: string, servicePointIds: string[], query: any): Promise<EnergyUsageRead[]> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let filteredReads: EnergyUsageRead[] = [];
        let readType: string = 'NONE';
        if (query["interval-reads"] != null &&
            (query["interval-reads"]?.toUpperCase() == "MIN_30")
            || query["interval-reads"]?.toUpperCase() == "FULL"
            || query["interval-reads"]?.toUpperCase() == "NONE") {
            readType = query["interval-reads"].toUpperCase();
        }
        if (cust != null) {
            var range: QueryRange = this.getDateRangeFromQueryParams(query, "oldest-date", "newest-date");

            cust?.energy?.servicePoints?.forEach((sp: any) => {
                var idx = servicePointIds?.indexOf(sp.servicePoint.servicePointId)
                if (idx > -1) {

                    sp?.usage.forEach((read: EnergyUsageRead) => {
                        if (read.readUType == "intervalRead" && (readType == "MIN_30" || readType == "FULL")) {
                            if (read.intervalRead != null) {
                                //TODO do something with the read intervals, ie calculate it then set it
                            }
                        }
                        let refDate = Date.parse(read.readStartDate);
                        if (isNaN(refDate) == false && (refDate >= range.startRange && refDate <= range.endRange)) {
                            filteredReads.push(read)
                        }
                    })

                }
            })
        }
        return filteredReads;
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
    async getInvoicesForAccount(customerId: string, accountId: string, query: any): Promise<EnergyInvoice[]> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let filteredInvoices: EnergyInvoice[] = [];
        if (cust != null) {
            let range: QueryRange = this.getDateRangeFromQueryParams(query, "oldest-date", "newest-date");
            cust?.energy?.accounts?.forEach((acc: any) => {
                if (acc.account.accountId == accountId) {
                    if (acc?.invoices != null) {

                        acc?.invoices.filter((inv: EnergyInvoice) => {
                            let refDate = Date.parse(inv.issueDate);
                            if (isNaN(refDate) || (refDate >= range.startRange && refDate <= range.endRange))
                                filteredInvoices.push(inv)
                        })
                    }
                }
            })
        }
        return filteredInvoices;
    }

    async getInvoicesForMultipleAccounts(customerId: string, accountIds: string[], query: any): Promise<EnergyInvoice[]> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let filteredInvoices: EnergyInvoice[] = [];
        if (cust != null) {
            let range: QueryRange = this.getDateRangeFromQueryParams(query, "oldest-date", "newest-date");
            cust?.energy?.accounts?.forEach((acc: any) => {
                if (accountIds?.indexOf(acc.account?.accountId) > -1) {
                    if (acc?.invoices != null) {
                        acc?.invoices.filter((inv: any) => {
                            let refDate = Date.parse(inv.issueDate);
                            if (isNaN(refDate) || (refDate >= range.startRange && refDate <= range.endRange))
                                filteredInvoices.push(inv)
                        })
                    }
                }
            })
        }
        return filteredInvoices;
    }

    async getConcesssionsForAccount(customerId: string, accountId: string): Promise<any> {
        throw new Error("Method not implemented.");
    }
    async getBalanceForAccount(customerId: string, accountId: string): Promise<any> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let ret: any = null;
        if (cust != null) {
            cust?.energy?.accounts?.forEach((acc: any) => {
                if (acc.account.accountId == accountId) {
                    ret.data.balance = acc.balance
                }
            })
        }
        return ret;
    }

    async getPaymentScheduleAccount(customerId: string, accountId: string): Promise<any> {
        throw new Error("Method not implemented.");
    }

    async getBillingForAccount(customerId: string, accountId: string, query: any): Promise<EnergyBillingTransactionV3[]> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let transactions: EnergyBillingTransactionV3[] = [];
        if (cust != null) {
            let range: QueryRange = this.getDateRangeFromQueryParams(query, "oldest-time", "newest-time");
            cust?.energy?.accounts?.forEach((acc: any) => {
                if (acc.account.accountId == accountId) {
                    if (acc?.invoices != null) {
                        acc?.transactions.forEach((tr: EnergyBillingTransactionV3) => {
                            if (Date.parse(tr.executionDateTime) >= range.startRange && Date.parse(tr.executionDateTime) <= range.endRange) {
                                transactions.push(tr);
                            }
                        })
                    }
                }
            })
        }
        return transactions;
    }

    async getUsageForServicePoint(customerId: string, servicePointId: string, query: any): Promise<EnergyUsageRead[]> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);

        let filteredReads: EnergyUsageRead[] = [];
        if (cust != null) {

            let range: QueryRange = this.getDateRangeFromQueryParams(query, "oldest-date", "newest-date");
            let sp: any = cust?.energy?.servicePoints?.find((x: any) => x.servicePoint.servicePointId == servicePointId);
            let readData = sp?.usage as EnergyUsageRead[];

            let readType: string = 'NONE';
            if ((query["interval-reads"] != undefined)) {
                if ((query["interval-reads"].toUpperCase() == "MIN_30")
                    || query["interval-reads"].toUpperCase() == "FULL"
                    || query["interval-reads"].toUpperCase() == "NONE") {
                    readType = query["interval-reads"].toUpperCase();
                }
            }

            readData.forEach((rd: EnergyUsageRead) => {
                if (rd.readUType == "intervalRead" && (readType == "MIN_30" || readType == "FULL")) {
                    if (rd.intervalRead != null) {
                        //TODO do something with the read intervals, ie calculate it then set it
                    }
                }
                let refDate = Date.parse(rd.readStartDate);
                if (isNaN(refDate) || (refDate >= range.startRange && refDate <= range.endRange)) {
                    filteredReads.push(rd)
                }
            })
        }
        return filteredReads;
    }
    async getDerForServicePoint(customerId: string, servicePointId: string): Promise<EnergyDerRecord | undefined> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let sp: any = cust?.energy.servicePoints.find((x: any) => x.der?.servicePointId == servicePointId);
        let derData: EnergyDerRecord = sp?.der;
        return derData;
    }

    async getEnergyAccountDetails(customerId: string, accountId: string): Promise<EnergyAccountDetailV3 | undefined> {
        let ret: any = {};
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let acc: any = cust?.energy.accounts.find((x: any) => x.account.accountId == accountId);
        return acc?.account as EnergyAccountDetailV3;
    }

    async getServicePointDetails(customerId: string, servicePointId: string): Promise<EnergyServicePointDetail> {
        let ret: any = {};
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let acc: any = cust?.energy.servicePoints.find((x: any) => x.servicePoint.servicePointId == servicePointId);
        //ret.data = acc?.servicePoint ? acc?.servicePoint : [];
        return acc?.servicePoint;
    }
    async loadCustomer(customer: any): Promise<boolean> {
        if (customer == null) return false;
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let ret = await customers.insertOne(customer);
        return ret.insertedId != null

    }
    async getEnergyAccounts(customerId: string, accountIds: string[], query: any): Promise<EnergyAccountV2[]> {
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let accList: EnergyAccountV2[] = [];
        let accDetailList = cust?.energy?.accounts as EnergyAccountDetailV3[];
        let openStatus = query["open-status"];

        if (accDetailList != null) {
            accDetailList.forEach((acc: any) => {
                let cnt = acc?.account?.plans?.length;
                if ((openStatus == null) || (openStatus.toUpperCase() == "ALL")
                    || (acc.account?.openStatus?.toUpperCase() == openStatus?.toUpperCase())) {
                    if (accountIds?.length > 0 && accountIds.indexOf(acc?.account?.accountId) > -1) {
                        let planList: any[] = [];
                        for (let i = 0; i < cnt; i++) {

                            let newPlan: any = {
                                nickname: acc.account?.plans[i]?.nickname,
                                servicePointIds: []
                            }
                            if (acc.account?.plans[i]?.planOverview)
                                newPlan.planOverview = acc.account?.plans[i]?.planOverview;
                            if (acc.account?.plans[i]?.servicePointIds)
                                newPlan.servicePointIds = acc.account?.plans[i]?.servicePointIds
                            planList.push(newPlan);
                        }
                        let newAccount: EnergyAccountV2 = {
                            plans: planList,
                            accountNumber: acc.account?.accountNumber,
                            accountId: acc.account?.accountId,
                            displayName: acc.account?.displayName,
                            openStatus: acc.account?.openStatus,
                            creationDate: acc.account?.creationDate as string
                        }
                        accList.push(newAccount);
                    }
                }
            })
        }
        return accList;
    }

    async getServicePointsForCustomer(customerId: string): Promise<string[] | undefined> {
        let ret: string[] = [];
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);
        let allPoints: any = cust?.energy.servicePoints;
        allPoints.forEach((sp: any) => {
            ret.push(sp.servicePointId)
        })
        return ret;
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

    // get all the logins for the ACCC cdr-auth-server UI
    async getLoginInformation(sector?: string, loginId?: string): Promise<CustomerModel[] | undefined> {
        var loginModel: CustomerModel[] = [];
        let allDataCollection: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let allData = await allDataCollection.findOne();
        if (allData?.holders != undefined) {
            let allCustomers = allData?.holders[0]?.holder?.authenticated?.customers;
            if (allCustomers.length < 1)
                return undefined;

            allCustomers.forEach((c: any) => {

                let id = `${c.customer?.person?.lastName}.${c.customer?.person?.firstName}`;
                if (id == loginId) {
                    let aModel: CustomerModel = {
                        LoginId: id,
                        Accounts: []
                    };
                    let accounts: AccountModel[] = [];

                    c?.energy?.accounts.forEach((acc: any) => {
                        let loginAccount: AccountModel = {
                            AccountId: acc?.account?.accountId,
                            AccountNumber: acc?.account?.accountNumber,
                            MaskedName: acc?.account?.maskedNumber,
                            DisplayName: `Energy - ${acc?.account?.displayName}`
                        };
                        accounts.push(loginAccount)
                    })
                    aModel.Accounts = accounts;
                    loginModel.push(aModel);

                    // TODO Once we have the API implemented for Banking, we can uncomment this
                    c?.banking?.accounts.forEach((acc: any) => {
                        let loginAccount: AccountModel = {
                            AccountId: acc?.account?.accountId,
                            AccountNumber: acc?.account?.accountNumber,
                            MaskedName: acc?.account?.maskedNumber,
                            DisplayName: `Banking - ${acc?.account?.displayName}`
                        };
                        accounts.push(loginAccount)
                    })
                    aModel.Accounts = accounts;
                    loginModel.push(aModel);
                }
            })
        }
        return loginModel;
    }

    async getServicePointsForUser(customerId: string): Promise<string[] | undefined> {
        let ret: string[] = [];
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_COLLECTION_NAME as string);
        let cust: any = await this.getCustomer(allData, customerId);

        return ret;
    }

}


