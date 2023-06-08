import express, { request } from 'express';
import { NextFunction, Request, Response } from 'express';
import { MongoData } from './services/database.service';
import { IDatabase } from './services/database.interface';
import * as path from 'path';
import * as fs from 'fs';
import { defer } from 'rxjs';

import * as dotenv from 'dotenv'; 

dotenv.config();

var dbService: IDatabase;
dbService = new MongoData();

const version = "1.22.0"

const holderId = null;
let inputPath = 'input/' + version
let outputPath = 'output/' + version

inputPath = path.join(__dirname, inputPath);
outputPath = path.join(__dirname, outputPath);

console.log("Uploading data for version " + version);

dbService.connectDatabase()
    .then(async () => {
        console.log("Connected to database...");
        var holderDirectories = fs.readdirSync(inputPath, { withFileTypes: true }).filter(dirent => dirent.isDirectory());

        if (holderId != null) {
            let holder = holderDirectories.find(x => x.name == holderId);
            var holderPath: string = '';
            if (holder?.isDirectory()) {
                holderPath = path.join(inputPath, holderId);
                const observable$ = defer(() => processHolder(holderPath));
                observable$.subscribe((ret: boolean) => {
                    console.log("Loaded data: " + ret);
                    process.exit();
                })
            }
        }
        else {
            holderDirectories.forEach((dir: any) => {
                holderPath = path.join(inputPath, dir.name);
                const observable$ = defer(() => processHolder(holderPath));
                observable$.subscribe((ret: boolean) => { 
                    console.log("Loaded data: " + ret);
                    process.exit();
                })
            })
        }
    })
    .catch((error: Error) => {
        console.error("Database connection failed", error);
        process.exit();
    })

async function processHolder(holderPath: string): Promise<boolean> {
    let customerDeleteCount = 0;
    let customerAddCount = 0;
    let planDeleteCount = 0;
    let planAddCount = 0;
    var holderSubs = fs.readdirSync(holderPath, { withFileTypes: true }).filter(dirent => dirent.isDirectory());
    if (holderSubs.length == 0)
        return Promise.resolve(false);
    else {
        for (let i = 0; i < holderSubs.length; i++) {
            var holderId: string = '';
            let dir = holderSubs[i];

            if (dir?.name == "customers") {
                let customerPath = path.join(holderPath, dir.name)
                let customerFiles = fs.readdirSync(customerPath)
                var customerIdList: any[] = [];
                customerDeleteCount = await dbService.deleteAllCustomers();

                console.log(`Deleted ${customerDeleteCount} customers`);
                let custArray: any[] = [];
                let cnt = customerFiles.length;

                for (let i = 0; i < cnt; i++) {
                    let file = customerFiles[i];
                    var filePath = path.join(customerPath, file);
                    let fileString = fs.readFileSync(filePath).toString();
                    var data = JSON.parse(fileString);
                    custArray.push(data);
                    await dbService.addCustomer(data);
                    customerAddCount++;
                    customerIdList.push(data.customerId);
                    holderId = data.holderId;
                    createIdFiles(data.holderId, data);
                };
                console.log(`Added ${customerAddCount} customers`);
            }

            if (dir.name == "plans") {
                let planPath = path.join(holderPath, dir.name)
                let planFiles = fs.readdirSync(planPath)
                var planIdList: any[] = [];
                planDeleteCount = await dbService.deleteAllPlans()
                console.log(`Deleted ${planDeleteCount} plans`);
                let cnt = planFiles.length;
                for (let i = 0; i < cnt; i++) {
                    let file = planFiles[i];
                    var filePath = path.join(planPath, file);
                    let fileString = fs.readFileSync(filePath).toString();
                    var data = JSON.parse(fileString);
                    await dbService.addPlan(data);
                    planAddCount++;
                    planIdList.push(data.planId);
                };
                console.log(`Added ${planAddCount} plans`);
                writePlanIdFile(data.holderId, planIdList);
            }
        }
        return Promise.resolve(true);
    }
    
}

function createIdFiles(holderId: string, data: any) {
    console.log("Creating id files...");
    let accountIds: string[] = [];
    let servicePointIds: string[] = [];
    let custDirName = data.customerId;
    let outDir = path.join(outputPath, holderId, custDirName);
    fs.mkdirSync(outDir, { recursive: true });

    data.energy?.accounts?.forEach((acc: any) => {
        let obj: any = {
            accountId: acc.account.accountId
        }
        accountIds.push(obj);
    })

    data.energy?.servicePoints?.forEach((sp: any) => {
        let obj: any = {
            servicePointId: sp.servicePoint.servicePointId
        }
        servicePointIds.push(obj);
    })
    let accountIdFile = path.join(outDir, 'accounts.json');
    fs.writeFileSync(accountIdFile, JSON.stringify(accountIds));
    console.log("Written accounts.json....");

    let servicePointIdFile = path.join(outDir, 'service-points.json');
    fs.writeFileSync(servicePointIdFile, JSON.stringify(servicePointIds));
    console.log("Written service-points.json....");
}


function writePlanIdFile(holderId: string, data: any[]) {
    //let custDirName = data.customerId;

    let outFileDir = path.join(outputPath, holderId);
    let outFile = path.join(outFileDir, 'plan-ids.json');
    fs.mkdirSync(outFileDir, { recursive: true });
    var planIdObjects: any[] = [];
    data?.forEach((entry: any) => {
        let obj: any = {
            planId: entry
        }
        planIdObjects.push(obj);
    });
    fs.writeFileSync(outFile, JSON.stringify(planIdObjects));
    console.log("Written plan ids....");
}