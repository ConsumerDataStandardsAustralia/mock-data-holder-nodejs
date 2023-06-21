import * as mongoDB from "mongodb";
import { IDatabaseLoader } from "./database-loader.interface";

export class MongoData implements IDatabaseLoader {

    public collections: mongoDB.Collection[] = [];
    private client : mongoDB.MongoClient;
    private dsbData: mongoDB.Db;

    constructor(){
        const connString = `mongodb://${process.env.MONGO_HOSTNAME}:${process.env.MONGO_PORT}`
        this.client = new mongoDB.MongoClient(connString, {monitorCommands: true});
        this.dsbData = this.client.db(process.env.MONGO_DB);
    }

    async loadPlans(planArray: any[]): Promise<number> {
        if (planArray == null) return -1;
        let plans: mongoDB.Collection = this.dsbData.collection(process.env.PLAN_COLLECTION_NAME as string);
        let ret = await plans.insertMany(planArray);
        return ret.insertedCount;
    }

    async loadCustomers(custArray: any[]): Promise<number>  {
        if (custArray == null) return -1;
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        let ret = await customers.insertMany(custArray);
        return ret.insertedCount;
    }

    async addPlan(plan: any): Promise<mongoDB.ObjectId|null> {
        if (plan == null) return null;
        let plans: mongoDB.Collection = this.dsbData.collection(process.env.PLAN_COLLECTION_NAME as string);
        let ret = await plans.insertOne(plan);
        return ret.insertedId;
    }

    async addCustomer(cust: any): Promise<mongoDB.ObjectId|null>  {
        if (cust == null) return null;
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        let ret = await customers.insertOne(cust);
        return ret.insertedId;
    }

    async deleteAllCustomers(): Promise<number> {   
        let customers: mongoDB.Collection = this.dsbData.collection(process.env.CUSTOMER_COLLECTION_NAME as string);
        let ret = await customers.deleteMany({});
        return ret.deletedCount
    }

    async deleteAllPlans(): Promise<number> {   
        let plans: mongoDB.Collection = this.dsbData.collection(process.env.PLAN_COLLECTION_NAME as string);
        let ret = await plans.deleteMany({});
        return ret.deletedCount
    }

    async getEnergyAccounts(customerId: string): Promise<any> {
        throw new Error("Method not implemented.");
    }

    async connectDatabase() {
        await this.client.connect();  
    }

    async disconnectDatabase(){
        await this.client.close();
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

    async createEmptyCollection(colName: string): Promise<mongoDB.Collection> {      
       let collection = await this.dsbData.collection(colName);
       await collection.insertOne({});
       return collection;
    }
}


