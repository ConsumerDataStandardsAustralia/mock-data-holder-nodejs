import express, { request }  from 'express';
import {NextFunction, Request, Response} from 'express';
import bodyParser from 'body-parser';
import * as dotenv from 'dotenv'; 



dotenv.config();
console.log(JSON.stringify(process.env, null, 2))

const dbHost = `${process.env.DB_HOST}`
const dbPort = 3005;

const exp = express;
const app = express();
const port = 3005;

// get billing for a number of accounts
app.get(`/jwks`, async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received request on ${port} for ${req.url}`);
    let result = 'Ades123'
    res.send(result);
});

app.listen(port, dbHost, () => {
    console.log(`Server running at http://${dbHost}:${dbPort}/`);
    console.log('Listening for requests....');
});