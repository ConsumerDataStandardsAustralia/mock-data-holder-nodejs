import express, { request }  from 'express';
import {NextFunction, Request, Response} from 'express';
import bodyParser from 'body-parser';
//import * as dotenv from 'dotenv'; 

import * as https from 'https'
import path from 'path';
import { readFileSync } from 'fs';

import {SwaggerUiOptions } from "swagger-ui-express";
import * as swaggerUI from 'swagger-ui-express'
const swaggerDocument = require("./data/cds-energy.json");
// dotenv.config();
console.log(JSON.stringify(process.env, null, 2))

const dbHost = `${process.env.DB_HOST}`
const adrPort = 3004;
const app = express();
const authServerHost = 'https://localhost';
const authServerPort = 8001;

async function startServer() {
  const certFile = path.join(__dirname, '/certificates/mtls-server.pem')
  const keyFile = path.join(__dirname, '/certificates/mtls-server.key')
  const rCert = readFileSync(certFile, 'utf8');
  const rKey = readFileSync(keyFile, 'utf8');
  const otions = {
    key: rKey,
    cert: rCert
  }
  https.createServer(otions, app)
    .listen(adrPort, () => {
      console.log('Server started');
    })
}

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument))

startServer();




// get the jwks signing key. This is called by the auth server
app.get(`/jwks`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${adrPort} for ${req.url}`);
    res.contentType('application/json')
    const jwkFile = path.join(__dirname, '/data/jwk.json')
    const jwk = JSON.parse(readFileSync(jwkFile, 'utf8'));
    console.log(jwk);
    res.send(jwk);
});

app.get(`/health`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${adrPort} for ${req.url}`);
    res.send('Server is running..');
});

app.get(`/callback`, async (req: Request, res: Response, next: NextFunction) => {
  console.log(`Received callback on ${adrPort} for ${req.url}`);
  res.send('Authentication complete');
});


