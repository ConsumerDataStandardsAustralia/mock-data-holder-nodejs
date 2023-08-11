export class CryptoUtils {
    
    public static jsonObjectToBase64(obj: any){
        // converts the obj to a string
        const str = JSON.stringify (obj);
        // returns string converted to base64
        return Buffer.from(str).toString ('base64');
    }
    public static replaceSpecialChars(b64string: string) {
        // create a regex to match any of the characters =,+ or / and replace them with their // substitutes
        let retVal = b64string.replace('/', '_');
        retVal = retVal.replace('=', '');
        retVal = retVal.replace('+', '-');
        return retVal;
    };
}