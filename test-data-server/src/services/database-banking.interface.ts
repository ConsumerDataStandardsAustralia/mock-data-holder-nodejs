import { BankingAccountV2, BankingAccountDetailV3, BankingProductV4, BankingTransaction, BankingBalance, BankingDirectDebit, BankingScheduledPaymentFrom, BankingScheduledPaymentV2, BankingPayeeV2, BankingPayeeDetailV2, BankingTransactionDetail } from "consumer-data-standards/banking";
import { CustomerModel } from "../models/login";

export interface IBankingData {

    getBankingProductDetails(productId: string): Promise<BankingProductV4 | undefined>;

    getAllBankingProducts(queryParameters: any): Promise<BankingProductV4[]>;

    getAccounts(customerId: string, accountIds: string[], queryParameters: any): Promise<BankingAccountV2[]>;

    getAccountDetail(customerId: string, accountId: string): Promise<BankingAccountDetailV3 | undefined>;

    getTransationsForAccount(customerId: string, accountId: string, queryParameters: any): Promise<BankingTransaction[]>;

    getTransactionDetail(customerId: string, accountId: string, transactionId: string): Promise<BankingTransactionDetail | undefined>;

    getBulkBalances(customerId: string, queryParameters: any): Promise<BankingBalance[]>;

    getAccountBalance(customerId: string, accountId: string): Promise<BankingBalance | undefined>;

    getBalancesForSpecificAccounts(customerId: string, accountIds: string[], queryParameters: any): Promise<BankingBalance[]>;

    getDirectDebitsForAccount(customerId: string, accountId: string, queryParameters: any): Promise<BankingDirectDebit[]>;

    getDirectDebitsForAccountList(customerId: string, accountIds: string[], queryParameters: any): Promise<BankingDirectDebit[]>;

    getBulkDirectDebits(customerId: string, queryParameters: any): Promise<BankingDirectDebit[]>;

    getScheduledPaymentsForAccount(customerId: string, accountId: string, queryParameters: any): Promise<BankingScheduledPaymentV2[]>;

    getScheduledPaymentsForAccountList(customerId: string, accountIds: string[], queryParameters: any): Promise<BankingScheduledPaymentV2[]>;

    getBulkScheduledPayments(customerId: string, queryParameters: any): Promise<BankingScheduledPaymentV2[]>;

    getPayees(customerId: string, queryParameters: any): Promise<BankingPayeeV2[]>;

    getPayeeDetail(customerId: string, payeeId: string): Promise<BankingPayeeDetailV2 | undefined>;

    getPayeesForCustomer(customerId: string): Promise<string[] | undefined>

}