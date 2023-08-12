export interface JwkKey {
    kty: string | undefined;
    use: string | undefined;
    kid: string;
    x5t: string | undefined;
    e: string | undefined;
    n: string | undefined;
    x5c: string[] | undefined;
    alg: string;
}