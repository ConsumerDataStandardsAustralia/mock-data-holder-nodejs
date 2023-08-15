
import jwtDecode from "jwt-decode";
import { JwkKey } from "./models/jwt-key";
import { CryptoUtils } from "./utils/crypto-utils";

export class AdrAuthService {

    algorithm = 'AES-256-CBC';
    jwtEncodingAlgorithm: string | undefined;
    jwkKeys: JwkKey[] | undefined;

    constructor() {
        this.jwtEncodingAlgorithm = 'ES256';
    }

    buildClientAssertion(token: string): string {
        let decoded: any = jwtDecode(token);
        let header = {
            alg: this.jwtEncodingAlgorithm,
            typ: 'JWT',
            version: true
        }
        const b64Header = CryptoUtils.jsonObjectToBase64 (header);
        const jwtB64Header = CryptoUtils.replaceSpecialChars (b64Header);

        // get the encoding algo from jwtKeys
        let encKey = this.jwkKeys?.find(x => x.alg == this.jwtEncodingAlgorithm);
        let x5cKeys = encKey?.x5c;
        let key = '';
        if (x5cKeys == undefined)
            return '';
        else
            key = x5cKeys[0];
        /*
        {
        "kid": "7C5716553E9B132EF325C49CA2079737196C03DB",
        "sub": "77831c42-7e8b-457a-93b2-d714bb3b2bc6",
        "aud": "https://localhost:3005",
        "iss": "77831c42-7e8b-457a-93b2-d714bb3b2bc6",
        "exp": 1876931108,
        "iat": 1676931048,
        "jti": "meDQDSVJa3GfZ2UGGT0r"
        }*/
        let payload = {
            kid: encKey?.kid,
            sub: decoded.client_id,
            aud: 'https://localhost:3003',
            iss: decoded.client_id,
            jti: decoded.jti,
            exp: decoded.exp,
            iat: decoded.iat
        }
        
        const b64Payload = CryptoUtils.jsonObjectToBase64 (payload);
        const jwtB64Payload = CryptoUtils.replaceSpecialChars (b64Payload);
        let signature = CryptoUtils.createSha256Signature(jwtB64Header, jwtB64Payload, key)
        const jsonWebToken = jwtB64Header + '.' + jwtB64Payload + '.' + signature;
        return jsonWebToken;

        // TODO encode the client_assertion with the jwks key
       //  return 'eyJhbGciOiJQUzI1NiIsInR5cCI6IkpXVCJ9.eyJraWQiOiJiNThiZDBmZi0wZjkyLTQwZjMtYTgwNC1kYzY1MjZlYzViYzYiLCJzdWIiOiI3NzgzMWM0Mi03ZThiLTQ1N2EtOTNiMi1kNzE0YmIzYjJiYzYiLCJhdWQiOiJodHRwczovL2RoLXRlc3QuaWRwLmRldi5jZHJzYW5kYm94Lmdvdi5hdS9mYXBpLWphcm0iLCJpc3MiOiI3NzgzMWM0Mi03ZThiLTQ1N2EtOTNiMi1kNzE0YmIzYjJiYzYiLCJleHAiOjE2NzY5MzExMDgsImlhdCI6MTY3NjkzMTA0OCwianRpIjoibWVEUURTVkphM0dmWjJVR0dUMHIifQ.cMiSpYQGHQJmcVWTPPeB4ucNyAPYkBx-zbqRBIXzPbEg-DJ5KlvgFVhMc1IUcmygPrGu4TSSr4W8DRTmlHThkqmNrYkOUY1UsMP1VOLPgDw8_dujI-XvuH7xsZojjNoZh53mikEaX4wgOrMs7bBBjHC6h7oO7a50a_2T03DAXKfgERjjMcrLvd8L5Hi7bZKxroKCT1d-azmS2S7_hpViBpqKJBuygkgvsi21vyHb4CwvnoVQIjpTx88YGrsQxlWApaohccgyt0vj9orRtWqjyikvczpRLq-cqyaaFv3S6fQ76MJ4z2Ojj7uLQzcG7j6sT3Z301ORTpfQfRJmGEMxyg';
    }
}