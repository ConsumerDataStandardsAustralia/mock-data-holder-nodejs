#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
OUTPUT_DIR="$SCRIPT_DIR/output"

HOLDER_PFX_PASSWORD="${HOLDER_PFX_PASSWORD:-#M0ckDataHolder#}"
RECIPIENT_PFX_PASSWORD="${RECIPIENT_PFX_PASSWORD:-#M0ckDataRecipient#}"
CA_PFX_PASSWORD="${CA_PFX_PASSWORD:-#M0ckCDRCA#}"

export_pfx() {
  key_file="$1"
  cert_file="$2"
  ca_file="$3"
  out_file="$4"
  password="$5"

  openssl pkcs12 -export \
    -out "$out_file" \
    -inkey "$key_file" \
    -in "$cert_file" \
    -certfile "$ca_file" \
    -password "pass:$password"
}

export_ca_pfx() {
  key_file="$1"
  cert_file="$2"
  out_file="$3"
  password="$4"

  openssl pkcs12 -export \
    -out "$out_file" \
    -inkey "$key_file" \
    -in "$cert_file" \
    -password "pass:$password"
}

# tls-gateway
export_pfx "$OUTPUT_DIR/tls-gateway/tls-server.key" "$OUTPUT_DIR/tls-gateway/tls-server.crt" "$OUTPUT_DIR/tls-gateway/ca.crt" "$OUTPUT_DIR/tls-gateway/tls-server.pfx" "$HOLDER_PFX_PASSWORD"
cp "$OUTPUT_DIR/tls-gateway/tls-server.pfx" "$OUTPUT_DIR/tls-gateway/dsb-server.pfx"

# mtls-gateway
export_pfx "$OUTPUT_DIR/mtls-gateway/mtls-server.key" "$OUTPUT_DIR/mtls-gateway/mtls-server.crt" "$OUTPUT_DIR/mtls-gateway/ca.crt" "$OUTPUT_DIR/mtls-gateway/mtls-server.pfx" "$HOLDER_PFX_PASSWORD"
export_pfx "$OUTPUT_DIR/mtls-gateway/client.key" "$OUTPUT_DIR/mtls-gateway/client.crt" "$OUTPUT_DIR/mtls-gateway/ca.crt" "$OUTPUT_DIR/mtls-gateway/client.pfx" "$RECIPIENT_PFX_PASSWORD"
cp "$OUTPUT_DIR/mtls-gateway/mtls-server.pfx" "$OUTPUT_DIR/mtls-gateway/dsb-server.pfx"

# mock-data-holder
export_ca_pfx "$OUTPUT_DIR/mock-data-holder/mtls/ca.key" "$OUTPUT_DIR/mock-data-holder/mtls/ca.crt" "$OUTPUT_DIR/mock-data-holder/mtls/ca.pfx" "$CA_PFX_PASSWORD"
export_pfx "$OUTPUT_DIR/mock-data-holder/mtls/server.key" "$OUTPUT_DIR/mock-data-holder/mtls/server.crt" "$OUTPUT_DIR/mock-data-holder/mtls/ca.crt" "$OUTPUT_DIR/mock-data-holder/mtls/server.pfx" "$HOLDER_PFX_PASSWORD"
export_pfx "$OUTPUT_DIR/mock-data-holder/mtls/client.key" "$OUTPUT_DIR/mock-data-holder/mtls/client.crt" "$OUTPUT_DIR/mock-data-holder/mtls/ca.crt" "$OUTPUT_DIR/mock-data-holder/mtls/client.pfx" "$RECIPIENT_PFX_PASSWORD"
export_ca_pfx "$OUTPUT_DIR/mock-data-holder/tls/ca.key" "$OUTPUT_DIR/mock-data-holder/tls/ca.crt" "$OUTPUT_DIR/mock-data-holder/tls/ca.pfx" "$CA_PFX_PASSWORD"
export_pfx "$OUTPUT_DIR/mock-data-holder/tls/mock-data-holder.key" "$OUTPUT_DIR/mock-data-holder/tls/mock-data-holder.crt" "$OUTPUT_DIR/mock-data-holder/tls/ca.crt" "$OUTPUT_DIR/mock-data-holder/tls/mock-data-holder.pfx" "$HOLDER_PFX_PASSWORD"
cp "$OUTPUT_DIR/mock-data-holder/tls/mock-data-holder.pfx" "$OUTPUT_DIR/mock-data-holder/tls/dsb-server.pfx"

# mock-data-recipient
export_pfx "$OUTPUT_DIR/mock-data-recipient/mtls/client.key" "$OUTPUT_DIR/mock-data-recipient/mtls/client.crt" "$OUTPUT_DIR/mock-data-recipient/mtls/ca.crt" "$OUTPUT_DIR/mock-data-recipient/mtls/client.pfx" "$RECIPIENT_PFX_PASSWORD"
export_pfx "$OUTPUT_DIR/mock-data-recipient/tls/mock-data-recipient.key" "$OUTPUT_DIR/mock-data-recipient/tls/mock-data-recipient.crt" "$OUTPUT_DIR/mock-data-recipient/mtls/ca.crt" "$OUTPUT_DIR/mock-data-recipient/tls/mock-data-recipient.pfx" "$RECIPIENT_PFX_PASSWORD"

# mock-register
export_ca_pfx "$OUTPUT_DIR/mock-register/mtls/ca.key" "$OUTPUT_DIR/mock-register/mtls/ca.crt" "$OUTPUT_DIR/mock-register/mtls/ca.pfx" "$CA_PFX_PASSWORD"
export_pfx "$OUTPUT_DIR/mock-register/mtls/server.key" "$OUTPUT_DIR/mock-register/mtls/server.crt" "$OUTPUT_DIR/mock-register/mtls/ca.crt" "$OUTPUT_DIR/mock-register/mtls/server.pfx" "$HOLDER_PFX_PASSWORD"
export_pfx "$OUTPUT_DIR/mock-register/mtls/server-energy.key" "$OUTPUT_DIR/mock-register/mtls/server-energy.crt" "$OUTPUT_DIR/mock-register/mtls/ca.crt" "$OUTPUT_DIR/mock-register/mtls/server-energy.pfx" "$HOLDER_PFX_PASSWORD"
export_pfx "$OUTPUT_DIR/mock-register/mtls/register.key" "$OUTPUT_DIR/mock-register/mtls/register.crt" "$OUTPUT_DIR/mock-register/mtls/ca.crt" "$OUTPUT_DIR/mock-register/mtls/register.pfx" "$HOLDER_PFX_PASSWORD"
export_pfx "$OUTPUT_DIR/mock-register/mtls/register-client.key" "$OUTPUT_DIR/mock-register/mtls/register-client.crt" "$OUTPUT_DIR/mock-register/mtls/ca.crt" "$OUTPUT_DIR/mock-register/mtls/register-client.pfx" "$RECIPIENT_PFX_PASSWORD"
export_pfx "$OUTPUT_DIR/mock-register/mtls/client.key" "$OUTPUT_DIR/mock-register/mtls/client.crt" "$OUTPUT_DIR/mock-register/mtls/ca.crt" "$OUTPUT_DIR/mock-register/mtls/client.pfx" "$RECIPIENT_PFX_PASSWORD"
export_pfx "$OUTPUT_DIR/mock-register/mtls/client-additional.key" "$OUTPUT_DIR/mock-register/mtls/client-additional.crt" "$OUTPUT_DIR/mock-register/mtls/ca.crt" "$OUTPUT_DIR/mock-register/mtls/client-additional.pfx" "$RECIPIENT_PFX_PASSWORD"
export_pfx "$OUTPUT_DIR/mock-register/mtls/client-invalid.key" "$OUTPUT_DIR/mock-register/mtls/client-invalid.crt" "$OUTPUT_DIR/mock-register/mtls/ca.crt" "$OUTPUT_DIR/mock-register/mtls/client-invalid.pfx" "$RECIPIENT_PFX_PASSWORD"

export_pfx "$OUTPUT_DIR/mock-register/tls/mock-register.key" "$OUTPUT_DIR/mock-register/tls/mock-register.crt" "$OUTPUT_DIR/mock-register/mtls/ca.crt" "$OUTPUT_DIR/mock-register/tls/mock-register.pfx" "$HOLDER_PFX_PASSWORD"
export_pfx "$OUTPUT_DIR/mock-register/tls/mock-data-holder.key" "$OUTPUT_DIR/mock-register/tls/mock-data-holder.crt" "$OUTPUT_DIR/mock-register/mtls/ca.crt" "$OUTPUT_DIR/mock-register/tls/mock-data-holder.pfx" "$HOLDER_PFX_PASSWORD"
export_pfx "$OUTPUT_DIR/mock-register/tls/mock-data-holder-energy.key" "$OUTPUT_DIR/mock-register/tls/mock-data-holder-energy.crt" "$OUTPUT_DIR/mock-register/mtls/ca.crt" "$OUTPUT_DIR/mock-register/tls/mock-data-holder-energy.pfx" "$HOLDER_PFX_PASSWORD"
export_pfx "$OUTPUT_DIR/mock-register/tls/mock-data-recipient.key" "$OUTPUT_DIR/mock-register/tls/mock-data-recipient.crt" "$OUTPUT_DIR/mock-register/mtls/ca.crt" "$OUTPUT_DIR/mock-register/tls/mock-data-recipient.pfx" "$RECIPIENT_PFX_PASSWORD"
export_pfx "$OUTPUT_DIR/mock-register/tls/tls-template.key" "$OUTPUT_DIR/mock-register/tls/tls-template.crt" "$OUTPUT_DIR/mock-register/mtls/ca.crt" "$OUTPUT_DIR/mock-register/tls/tls-template.pfx" "$HOLDER_PFX_PASSWORD"
cp "$OUTPUT_DIR/mock-register/tls/mock-register.pfx" "$OUTPUT_DIR/mock-register/tls/tls-mock-register.pfx"
cp "$OUTPUT_DIR/mock-register/tls/mock-data-recipient.pfx" "$OUTPUT_DIR/mock-register/tls/tls-mock-data-recipient.pfx"

export_pfx "$OUTPUT_DIR/mock-register/ssa/ssa.key" "$OUTPUT_DIR/mock-register/ssa/ssa.crt" "$OUTPUT_DIR/mock-register/ssa/ssa.crt" "$OUTPUT_DIR/mock-register/ssa/ssa.pfx" "$HOLDER_PFX_PASSWORD"

# cdr-auth-server
export_pfx "$OUTPUT_DIR/cdr-auth-server/mtls/mtls-server.key" "$OUTPUT_DIR/cdr-auth-server/mtls/mtls-server.crt" "$OUTPUT_DIR/cdr-auth-server/mtls/ca.crt" "$OUTPUT_DIR/cdr-auth-server/mtls/mtls-server.pfx" "$HOLDER_PFX_PASSWORD"
export_pfx "$OUTPUT_DIR/cdr-auth-server/tls/tls-server.key" "$OUTPUT_DIR/cdr-auth-server/tls/tls-server.crt" "$OUTPUT_DIR/cdr-auth-server/mtls/ca.crt" "$OUTPUT_DIR/cdr-auth-server/tls/tls-server.pfx" "$HOLDER_PFX_PASSWORD"
cp "$OUTPUT_DIR/cdr-auth-server/tls/tls-server.pfx" "$OUTPUT_DIR/cdr-auth-server/tls-server.pfx"

export_pfx "$OUTPUT_DIR/cdr-auth-server/nginx/ssl/authserver-ui.key" "$OUTPUT_DIR/cdr-auth-server/nginx/ssl/authserver-ui.crt" "$OUTPUT_DIR/cdr-auth-server/mtls/ca.crt" "$OUTPUT_DIR/cdr-auth-server/nginx/ssl/authserver-ui.pfx" "$HOLDER_PFX_PASSWORD"

echo "Generated PKCS#12 bundles in $OUTPUT_DIR"
