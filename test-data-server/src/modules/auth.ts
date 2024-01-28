import { DsbResponse } from "@cds-au/holder-sdk";
import { AuthService } from "./auth-service";
import { IDatabase } from "../services/database.interface";



export function cdrAuthorization(dbService: IDatabase): any {
    // Do something with config here
    //let srv = authServer;
    
    return function authorize(req: Request, res: DsbResponse) {
        let authService = new AuthService(dbService);
        let temp = req.headers?.get('Authorization') as string;
        if (temp == null) {
            res.status(404).json('No authorization header provided');
            return;
        }
        // validate access token via introspective endpoint

        
        return temp?.split(" ")[1];
    };
    return function setUser(req: Request, res: DsbResponse) {

        // decode account ids
        // set user object
    }
};