
import { createHmac } from "crypto";

export class CryptoUtils {

    public static jsonObjectToBase64(obj: any) {
        // converts the obj to a string
        const str = JSON.stringify(obj);
        // returns string converted to base64
        return Buffer.from(str).toString('base64');
    }

    public static replaceSpecialChars(b64string: string) {
        // create a regex to match any of the characters =,+ or / and replace them with their // substitutes
        let retVal = b64string.replace('/', '_');
        retVal = retVal.replace('=', '');
        retVal = retVal.replace('+', '-');
        return retVal;
    };

    public static createSha256Signature(jwtB64Header: string, jwtB64Payload: string, secret: string) {
        // create a HMAC(hash based message authentication code) using sha256 hashing alg
        let signature = createHmac('sha256', secret);

        // use the update method to hash a string formed from our jwtB64Header a period and 
        //jwtB64Payload 
        signature.update(jwtB64Header + '.' + jwtB64Payload);

        //signature needs to be converted to base64 to make it usable
        let retVal = signature.digest('base64');

        //of course we need to clean the base64 string of URL special characters
        retVal = this.replaceSpecialChars(retVal);
        return retVal;
    }
}