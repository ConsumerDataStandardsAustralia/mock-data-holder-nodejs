import { BankingAccountV2, BankingAccountDetailV3, BankingProductV4, BankingTransaction, BankingBalance, BankingDirectDebit, 
    BankingScheduledPaymentFrom, BankingScheduledPaymentV2, BankingPayeeV2, BankingPayeeDetailV2, BankingTransactionDetailV2,
    BankingAccountV3, BankingTransactionDetailV3, BankingAccountDetailV5, BankingTransactionV2, BankingProductV6, BankingProductV5,
    BankingAccountDetailV4, BankingProductDetailV5, BankingProductDetailV6, BankingProductDetailV7 } from "consumer-data-standards/banking";
import { CustomerModel } from "../models/login";

export interface IBankingData {

    getBankingProductDetails(productId: string, version?: number): Promise<BankingProductDetailV5 | BankingProductDetailV6 | BankingProductDetailV7  | undefined>;

    getAllBankingProducts(queryParameters: any, version?: number): Promise<BankingProductV4[] | BankingProductV5[] | BankingProductV6[]>;

    getAccounts(customerId: string, accountIds: string[], queryParameters: any, version?: number): Promise<BankingAccountV2[] | BankingAccountV3[]>;

    getAccountDetail(customerId: string, accountId: string, version?: number): Promise<BankingAccountDetailV3 | BankingAccountDetailV4 | BankingAccountDetailV5 | undefined>;

    getTransationsForAccount(customerId: string, accountId: string, queryParameters: any, version?: number): Promise<BankingTransaction[] | BankingTransactionV2[]>;

    getTransactionDetail(customerId: string, accountId: string, transactionId: string, version?: number): Promise<BankingTransactionDetailV2 | BankingTransactionDetailV3 | undefined>;

    getBulkBalances(customerId: string, queryParameters: any, version?: number): Promise<BankingBalance[]>;

    getAccountBalance(customerId: string, accountId: string, version?: number): Promise<BankingBalance | undefined>;

    getBalancesForSpecificAccounts(customerId: string, accountIds: string[], queryParameters: any, version?: number): Promise<BankingBalance[]>;

    getDirectDebitsForAccount(customerId: string, accountId: string, queryParameters: any, version?: number): Promise<BankingDirectDebit[]>;

    getDirectDebitsForAccountList(customerId: string, accountIds: string[], queryParameters: any, version?: number): Promise<BankingDirectDebit[]>;

    getBulkDirectDebits(customerId: string, queryParameters: any, version?: number): Promise<BankingDirectDebit[]>;

    getScheduledPaymentsForAccount(customerId: string, accountId: string, queryParameters: any, version?: number): Promise<BankingScheduledPaymentV2[]>;

    getScheduledPaymentsForAccountList(customerId: string, accountIds: string[], queryParameters: any, version?: number): Promise<BankingScheduledPaymentV2[]>;

    getBulkScheduledPayments(customerId: string, queryParameters: any, version?: number): Promise<BankingScheduledPaymentV2[]>;

    getPayees(customerId: string, queryParameters: any, version?: number): Promise<BankingPayeeV2[]>;

    getPayeeDetail(customerId: string, payeeId: string, version?: number): Promise<BankingPayeeDetailV2 | undefined>;

    getPayeesForCustomer(customerId: string, version?: number): Promise<string[] | undefined>;

    // This method is used when the server is run without authentication and a user is set in the env file
    getAllBankingAccountsForCustomer(customerId: string, version?: number) : Promise<BankingAccountV2[] | BankingAccountV3[]> | undefined;

}