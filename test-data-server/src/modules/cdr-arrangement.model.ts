
export interface DsbArrangmentAccount {
    AccountId: string;
    Sector?: string;
    DisplayName?: string;
}
export interface CdrArrangement {
    dataHolderId: string;
    softwareProductId: string;
    loginId: string;
    grantId: string;
    scopes: string;
    consentedEnergyAccounts?: DsbArrangmentAccount[];
    consentedBankingAccounts?: DsbArrangmentAccount[]
}