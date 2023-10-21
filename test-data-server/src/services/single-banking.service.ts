import { Service } from "typedi";
import { IBankingData } from "./database-banking.interface";
import { AccountModel, CustomerModel } from "../models/login";
import * as mongoDB from "mongodb";
import { BankingProductDetailV4, BankingProductV4, Links, LinksPaginated, Meta, MetaPaginated } from "consumer-data-standards/banking";

@Service()
export class BankingDataSingle implements IBankingData {

    public collections: mongoDB.Collection[] = [];
    private client: mongoDB.MongoClient;
    private dsbData: mongoDB.Db;
    private dsbName: string;

    constructor(connString: string, dbName: string) {
        this.client = new mongoDB.MongoClient(connString, { monitorCommands: true });
        this.dsbName = dbName;
        this.dsbData = this.client.db(dbName);
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

    async getAllBankingProducts(queryParameters: any): Promise<any> {
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

    async loadCustomer(customer: any): Promise<boolean> {
        if (customer == null) return false;
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
        let ret = await customers.insertOne(customer);
        return ret.insertedId != null

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

    async getBankingProductDetails(productId: string): Promise<any> {
        let ret: any = {};
        let allData: mongoDB.Collection = this.dsbData.collection(process.env.SINGLE_DATA_DOCUMENT as string);
        // const query = { productId: productId };
        let product: any = await this.getProducts(allData, productId);

        if (product == null || product.length == 0)
            return null;

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
}