# Test  Data ADR

## How to make an authorization request

### Call the PAR endpoint

The request object
```
{
// The same as the client_id
  "iss": "77831c42-7e8b-457a-93b2-d714bb3b2bc6", 
  // The identifier of the jwk signing token (see in /data/jwk.son)
  "kid": "b58bd0ff-0f92-40f3-a804-dc6526ec5bc6", 
  "response_type": "code", 
  "code_challenge_method": "S256",
  "nonce": "pUrzbYRmip",
  // The client_id as registered via the DCR
  "client_id": "77831c42-7e8b-457a-93b2-d714bb3b2bc6", 
  "response_mode": "jwt",
  // The url of the PAR endpoint
  "aud": "https://localhost:8082/connect/par",
  "nbf": 1676931048,
  "scope": "openid profile common:customer.basic:read energy:accounts.basic:read energy:accounts.concessions:read",
  "claims": {
    "sharing_duration": 7776000,
    "id_token": {
      "acr": {
        "value": "urn:cds.au:cdr:2",
        "essential": true
      }
    }
  },
  // The OAuth redirect url
  "redirect_uri": "https://localhost:3005/callback",
  "state": "KvvmtMvBV0",
  // The expiry of the this request. Cannot be more than 60 minutes after nbf
  "exp": 1876931348,
  "code_challenge": "DLmRwoU1A8yGm1MEutA8qHkRToG3er32rEwsevYNQNg"
}
```

The client_assertion object

```
{
  "sub": "77831c42-7e8b-457a-93b2-d714bb3b2bc6",
  "aud": "https://localhost:3005",
  "iss": "77831c42-7e8b-457a-93b2-d714bb3b2bc6",
  "exp": 1876931108,
  "iat": 1676931048,
  "jti": "meDQDSVJa3GfZ2UGGT0r"
}
```

These objects need to be converted into a signed JWT.

During the authentication flow the /jwk endpoint of the ADR will be called to retrieve the signing key `./key.pem`. 
```
{
    "keys": [
    {
        "kty": "RSA",
        "e": "AQAB",
        "kid": "bf9a6b54-48a7-4da9-9240-197b8e548a4c",
        "n": "zhPmvymt8BPb0lDa-menBTbqm--q-uJnAzTwL0QOkk7Z7epVGOd-SYUA9msZnILP8te_rkpJrH0AP3p2mlVDXBKFJrWWmXwNGoDk2Y9i4UjN-UXgYN0uSisjfCoLvtC2GTfEF_a8y4qPAr0QwOBRa4kfNeNDD4xxTfE246DhAakrqCU2zEisiY8OXvufZLvRyMpLtVdmm0ywY2EzHNP7NnxejwjjvxOTmLF3-zgwXAeiCJnBKeblNS9GCt1WhW78oy8t7DL7xwBKjWFUIa4ejXx8-lKgm6xBFYqRG5rfOz28EcWzqdA05LNRyvpuGMklZKqDoBtLgAiL0W4Lej17iw"
    }]
}
```

The resulting object will be 

request=eyJhbGciOiJQUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI3NzgzMWM0Mi03ZThiLTQ1N2EtOTNiMi1kNzE0YmIzYjJiYzYiLCJraWQiOiJiNThiZDBmZi0wZjkyLTQwZjMtYTgwNC1kYzY1MjZlYzViYzYiLCJyZXNwb25zZV90eXBlIjoiY29kZSIsImNvZGVfY2hhbGxlbmdlX21ldGhvZCI6IlMyNTYiLCJub25jZSI6InBVcnpiWVJtaXAiLCJjbGllbnRfaWQiOiI3NzgzMWM0Mi03ZThiLTQ1N2EtOTNiMi1kNzE0YmIzYjJiYzYiLCJyZXNwb25zZV9tb2RlIjoiand0IiwiYXVkIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6MzAwNSIsIm5iZiI6MTY3NjkzMTA0OCwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBjb21tb246Y3VzdG9tZXIuYmFzaWM6cmVhZCBlbmVyZ3k6YWNjb3VudHMuYmFzaWM6cmVhZCBlbmVyZ3k6YWNjb3VudHMuY29uY2Vzc2lvbnM6cmVhZCIsImNsYWltcyI6eyJzaGFyaW5nX2R1cmF0aW9uIjo3Nzc2MDAwLCJpZF90b2tlbiI6eyJhY3IiOnsidmFsdWUiOiJ1cm46Y2RzLmF1OmNkcjoyIiwiZXNzZW50aWFsIjp0cnVlfX19LCJyZWRpcmVjdF91cmkiOiJodHRwczovL3d3dy5jZXJ0aWZpY2F0aW9uLm9wZW5pZC5uZXQvdGVzdC9hL2Nkci1tZGgvY2FsbGJhY2siLCJzdGF0ZSI6Ikt2dm10TXZCVjAiLCJleHAiOjE2NzY5MzEzNDgsImNvZGVfY2hhbGxlbmdlIjoiRExtUndvVTFBOHlHbTFNRXV0QThxSGtSVG9HM2VyMzJyRXdzZXZZTlFOZyJ9.mclhTfqHTfRE9NmsTmWzzYzQEnJApZwP4zo8P9LOyeQjYKDdI9_4Aa1TrNtYX_3tNZwvdkoA9qC_hQqGAyTR4i_54grEONbthKEsspq5G-pzekPHjFYbeORQFvDuUINgNjK6ef8TsfVqWapZtLbmraz2jkOu-1IVY2TxtP_OITQ6tqjM2TMGUc7y44gZxooZ6eopy_OFPGHRJ4toBN53LWEPjoqV4pfxlEw19FoTqhyx6iC8k5l4IdejCw3g3PyC5_VnPX_lewBUQ40mNRn_ceLhp4GjGqWDQP5UzfpGvi2C87T8cVV8LZsC9j8zT3QMgZSKfev4Oy6LIgU1Ni7UcQ&eyJclient_assertion=eyJhbGciOiJQUzI1NiIsInR5cCI6IkpXVCJ9.eyJraWQiOiJiNThiZDBmZi0wZjkyLTQwZjMtYTgwNC1kYzY1MjZlYzViYzYiLCJzdWIiOiI3NzgzMWM0Mi03ZThiLTQ1N2EtOTNiMi1kNzE0YmIzYjJiYzYiLCJhdWQiOiJodHRwczovL2RoLXRlc3QuaWRwLmRldi5jZHJzYW5kYm94Lmdvdi5hdS9mYXBpLWphcm0iLCJpc3MiOiI3NzgzMWM0Mi03ZThiLTQ1N2EtOTNiMi1kNzE0YmIzYjJiYzYiLCJleHAiOjE2NzY5MzExMDgsImlhdCI6MTY3NjkzMTA0OCwianRpIjoibWVEUURTVkphM0dmWjJVR0dUMHIifQ.cMiSpYQGHQJmcVWTPPeB4ucNyAPYkBx-zbqRBIXzPbEg-DJ5KlvgFVhMc1IUcmygPrGu4TSSr4W8DRTmlHThkqmNrYkOUY1UsMP1VOLPgDw8_dujI-XvuH7xsZojjNoZh53mikEaX4wgOrMs7bBBjHC6h7oO7a50a_2T03DAXKfgERjjMcrLvd8L5Hi7bZKxroKCT1d-azmS2S7_hpViBpqKJBuygkgvsi21vyHb4CwvnoVQIjpTx88YGrsQxlWApaohccgyt0vj9orRtWqjyikvczpRLq-cqyaaFv3S6fQ76MJ4z2Ojj7uLQzcG7j6sT3Z301ORTpfQfRJmGEMxyg&client_assertion_type=urn%3Aietf%3Aparams%3Aoauth%3Aclient-assertion-type%3Ajwt-bearer
