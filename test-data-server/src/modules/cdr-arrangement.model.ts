export interface CdrArrangement {
    dataHolderId: string;
    softwareProductId: string;
    loginId: string;
    grantId: string;
    scopes: string;
    consentedEnergyAccounts?: string[];
    consentedBankingAccounts?: string[]
}