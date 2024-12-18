import { DsbCdrUser } from "../models/user";

export interface IAuthService {
    authUser: DsbCdrUser| undefined;
    initAuthService(): Promise<boolean>;
    verifyAccessToken(token?: string): Promise<boolean>
}