export interface CdrUser {
    customerId: string; // the internal customer id used by the DH
    loginId: string; // the unique login used for authorisation, which is returned as userId 
    encodeUserId: string;
    encodedAccounts: string[] | undefined;
    accounts: string[] | undefined;

}