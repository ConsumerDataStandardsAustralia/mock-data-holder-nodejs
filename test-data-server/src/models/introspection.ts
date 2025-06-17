export interface Introspection {
    cdr_arrangement_id: string | undefined;
    client_id: string | undefined
    scope: string | undefined;
    exp: number | undefined;
    iat: number | undefined;
    iss: string | undefined;
    active: boolean;
    token_type: string | undefined;
    sub: string| undefined;
}