# Security generation with Smallstep and OpenSSL

This folder keeps certificate generation split into two containers:

- `step-cert` creates root CAs and leaf certs with `step`
- `openssl-pfx` converts generated cert/key pairs to `.pfx`

The scripts now generate parity outputs for the legacy `security/` structure under:

- `security/output/tls-gateway`
- `security/output/mtls-gateway`
- `security/output/mock-data-holder/{mtls,tls}`
- `security/output/mock-data-recipient/{mtls,tls}`
- `security/output/mock-register/{mtls,tls,ssa}`
- `security/output/cdr-auth-server/{mtls,tls,nginx/ssl}`

## Run

From repo root:

```bash
sudo ./security/generate-certs.sh
```

Or run each stage directly:

```bash
sudo docker compose -f security/docker-compose.yaml run --rm step-cert
sudo docker compose -f security/docker-compose.yaml run --rm openssl-pfx
```

## PFX passwords

`generate-pfx.sh` uses these defaults, and each can be overridden with env vars:

- `HOLDER_PFX_PASSWORD=#M0ckDataHolder#`
- `RECIPIENT_PFX_PASSWORD=#M0ckDataRecipient#`
- `CA_PFX_PASSWORD=#M0ckCDRCA#`

Example:

```bash
HOLDER_PFX_PASSWORD='custom' sudo ./security/generate-certs.sh
```

## Notes

- Trust domains remain separated (matching the legacy layout).
- Generated files are written only under `security/output`.