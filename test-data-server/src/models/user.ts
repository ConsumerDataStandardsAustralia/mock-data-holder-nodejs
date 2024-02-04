import { CdrUser } from "@cds-au/holder-sdk";

export interface DsbCdrUser extends CdrUser {
    customerId: string; // the internal customer id used by the DH
    loginId: string | undefined; // the unique login used for authorisation, which is returned as userId 
    encodeUserId: string | undefined;
    encodedAccounts: string[] | undefined;
    //accounts: string[] | undefined;
    scopes_supported: string[] | undefined;
}