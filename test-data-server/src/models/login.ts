export type CustomerModel = {
    LoginId: string,
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    lastUpdateTime?: string;
    Accounts: AccountModel[]
}

export type AccountModel = {
    AccountId: string,
    DisplayName: string,
    ProductName?: string,
    MaskedName?: string,
    AccountNumber?:string,
    Sector?: string;
}