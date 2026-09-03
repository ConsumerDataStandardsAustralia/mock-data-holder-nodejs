#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
OUTPUT_DIR="$SCRIPT_DIR/output"
STEP_FORCE_FLAG=""

confirm_rewrite() {
  if [ ! -d "$OUTPUT_DIR" ] || [ -z "$(find "$OUTPUT_DIR" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]; then
    return 0
  fi

  if [ "${REWRITE_CERTS:-}" = "1" ] || [ "${REWRITE_CERTS:-}" = "true" ] || [ "${REWRITE_CERTS:-}" = "yes" ] || [ "${REWRITE_CERTS:-}" = "y" ]; then
    STEP_FORCE_FLAG="--force"
    return 0
  fi

  printf 'Existing certificates were found in %s.\n' "$OUTPUT_DIR"
  printf 'Rewrite existing certificates? [y/N]: '
  IFS= read -r response || response='n'
  normalized="$(printf '%s' "$response" | tr '[:upper:]' '[:lower:]')"

  case "$normalized" in
    y|yes)
      STEP_FORCE_FLAG="--force"
      return 0
      ;;
    *)
      echo "Leaving existing certificates unchanged."
      return 1
      ;;
  esac
}

if ! confirm_rewrite; then
  exit 0
fi

create_ca() {
  ca_name="$1"
  ca_dir="$2"
  not_after="$3"

  mkdir -p "$ca_dir"
  step certificate create "$ca_name" \
    "$ca_dir/ca.crt" \
    "$ca_dir/ca.key" \
    --profile root-ca \
    --not-after "$not_after" \
    --no-password \
    --insecure \
    ${STEP_FORCE_FLAG:+$STEP_FORCE_FLAG}
  cp "$ca_dir/ca.crt" "$ca_dir/ca.pem"
}

create_leaf() {
  common_name="$1"
  cert_dir="$2"
  cert_name="$3"
  ca_dir="$4"
  not_after="$5"
  shift 5

  mkdir -p "$cert_dir"
  step certificate create "$common_name" \
    "$cert_dir/$cert_name.crt" \
    "$cert_dir/$cert_name.key" \
    --profile leaf \
    --ca "$ca_dir/ca.crt" \
    --ca-key "$ca_dir/ca.key" \
    --not-after "$not_after" \
    --bundle \
    --kty RSA \
    --size 2048 \
    --no-password \
    --insecure \
    ${STEP_FORCE_FLAG:+$STEP_FORCE_FLAG} \
    "$@"
  cp "$cert_dir/$cert_name.crt" "$cert_dir/$cert_name.pem"
}

create_self_signed_leaf() {
  common_name="$1"
  cert_dir="$2"
  cert_name="$3"
  not_after="$4"
  shift 4

  mkdir -p "$cert_dir"
  step certificate create "$common_name" \
    "$cert_dir/$cert_name.crt" \
    "$cert_dir/$cert_name.key" \
    --profile self-signed \
    --subtle \
    --not-after "$not_after" \
    --kty RSA \
    --size 2048 \
    --no-password \
    --insecure \
    ${STEP_FORCE_FLAG:+$STEP_FORCE_FLAG} \
    "$@"
  cp "$cert_dir/$cert_name.crt" "$cert_dir/$cert_name.pem"
}

copy_leaf_alias() {
  src_dir="$1"
  src_name="$2"
  alias_name="$3"

  cp "$src_dir/$src_name.crt" "$src_dir/$alias_name.crt"
  cp "$src_dir/$src_name.pem" "$src_dir/$alias_name.pem"
  cp "$src_dir/$src_name.key" "$src_dir/$alias_name.key"
}

write_mock_data_holder_jwks() {
  mkdir -p "$OUTPUT_DIR/mock-data-holder/tls"

  cat > "$OUTPUT_DIR/mock-data-holder/tls/public.json" <<'EOF'
{
    "alg": "PS256",
    "e": "AQAB",
    "key_ops": [
      "verify"
    ],
    "kty": "RSA",
    "n": "24tV2AqOvZq_tfGqpqsePkKYavtjmaBeIc5XW00mndCwK4L3L_hoFknM1P-2jTq10gncep_szD4U0IzyPv2DFKN1-qSGS4nME4yT_f3mXlDuN_yUItljX0HYo1dfYKDLybQhKchRnhBNIFY5dltMBP6Ow6_o9H2n1LEkRKf9WpUDVbwl_TrDJtj-hP_-mPxyblH4ehNq7HBmmB4z41Ns40-y8qlSXScbGGRHQlca1EsirdIUSKor_aBYUdMibYHpyZ6IAlONXirW4yVFc4JGa7SC75j5NKdgp7SQcqVZeNXM3JwNOuM7zlFz_QqmNgVXOTZs1HftwDaD1WLqv3pEXu9x5T6jHnaDO6zxqF8HocU6oBTxh0uHQ3UGFVO5veAa7nrLoc8pCvoQYSuyhgd7KqAiHvBG7nmaTPnNmkeZv6DbRR1ckfVspUv6e7YI0WBeLHYoyVFS8EYf-CyGMnnqzLOsgFKuPwOKmp_4HvaajZDVe836p86l548KhqkVRzz7",
    "use": "sig",
    "kid": "4b37a76a0d0e5e0e529c0092c3832287"
}
EOF

  cat > "$OUTPUT_DIR/mock-data-holder/tls/private.json" <<'EOF'
{
    "alg": "PS256",
    "d": "YHDry9SPcaDp-E3pzf87cNQmSlCWJyU4VJdk7nmMriS_Ts3gMhVn--p9bU_LbGzO9C5ayQ85oVrgH-DahWstysInkGv3hnVIzYmidR-0s9fPXY65sDlYmr69ILu_7R2Vh8x2CPmzSMEWcE8QPPrMASGlqza6GbSdJiSOrw4wkDsHVQEqmvvWQFlwLRKbT68NwYKGqXGgNa8GkmoqFwFNwuj-zfQtdzg3gdaDKxRCd-FtoXe4a1c9rdNjGMarx_kZ3ijaF20C63GozGIe-Uct5MX69MZ9L5EK4q5qUKDFaHu04prWqsNY8IqvnOG1ml_liSn6MF14RJkPNHQE6cAB-MXfOQ7-j9xA1763hAql1uWFuLlhI__LoQiDEOXQWk-aN7fKnkFJ9ca8_mDyKvBjm1oQvLlXPSlp22UelDMjfifS5wbWChW8y1deeEMcmY6f0lNoAU1czQWLZ6FOlOP6_GtUBOYRNbeEblWpR4t-_Sxf1BY4VlU2a88AjgPKOpNZ",
    "dp": "imbtC-9CkmQxmySQcD8Gmj619UdTCiID1pzNtwrB9zDHqo94oXfwsMyPqGelx7-Gp6GWvmGbWMsfT-yaG_mZyWfLSdFczAyP54B0sBC9UJsnaxbmrkDt-uZ5BSu2BtiTbG7QW9Qk_diPYxX7VwfTuldwFwI_yOekXTZ4dyD3sm1ikFt3h7ZK_R3ba-f-tGLnPspQPppvsIRtWNI0ounQT4QpMqPUgeervyj2nmsro2jUIFDkiQhTL2vbwUjM74VR",
    "dq": "xycetbYXWCOW7nPc_ji2amEONiSzwKkJ086_FlRUJ47DDcJ_rsaiw3gt4rxUJGxVWN6v0-fCJ8n9aHd_WuGLIG7qTOdYAz7h75gY7ot3cGAKw_vjIUbfnSRgDFPJnpkr196vpExnqfim1yG8HMBHR1ZYta09RpHJ4j4IEZ8n4SpL-N7TC8gR0MBbQsYuQOOSrBlKKPMfiUGiCUFmvPsPCdc0NvreJoDXcjQy2EePP2F7ijrCyHkGq0M0t5kWDu4l",
    "e": "AQAB",
    "key_ops": [
      "sign"
    ],
    "kty": "RSA",
    "n": "24tV2AqOvZq_tfGqpqsePkKYavtjmaBeIc5XW00mndCwK4L3L_hoFknM1P-2jTq10gncep_szD4U0IzyPv2DFKN1-qSGS4nME4yT_f3mXlDuN_yUItljX0HYo1dfYKDLybQhKchRnhBNIFY5dltMBP6Ow6_o9H2n1LEkRKf9WpUDVbwl_TrDJtj-hP_-mPxyblH4ehNq7HBmmB4z41Ns40-y8qlSXScbGGRHQlca1EsirdIUSKor_aBYUdMibYHpyZ6IAlONXirW4yVFc4JGa7SC75j5NKdgp7SQcqVZeNXM3JwNOuM7zlFz_QqmNgVXOTZs1HftwDaD1WLqv3pEXu9x5T6jHnaDO6zxqF8HocU6oBTxh0uHQ3UGFVO5veAa7nrLoc8pCvoQYSuyhgd7KqAiHvBG7nmaTPnNmkeZv6DbRR1ckfVspUv6e7YI0WBeLHYoyVFS8EYf-CyGMnnqzLOsgFKuPwOKmp_4HvaajZDVe836p86l548KhqkVRzz7",
    "p": "_kYYl8VQci793vmYdpv65kKZbvU1dgSUEerJ41rVPfecEdlTxVQ9JijECkWR_oudTYIGxj7-S3xa5693MP_BGRmyY_zVGDzT4R1szKe9Lp80HhJicO0zAmLG2ASO-WM5Y_hmCkBsEEmVEVHM_ylbPkHeddN_P2DzAJgut1OkDOWRo1KsJNfGCdLSFURWx-uHrTkeNI0bPAZqMUGaiEjvtFz0gk3Jf_GhUbslqGb0Vc44cbYz-L5Z2RFceF5B9_p_",
    "q": "3Qjh8kcULqTjTeWy_JP-0RxMsreTtULtavphgeYGRLp8G18lbtFugUkCZsRPVzv6oRyT2QgjRU09coXm368BpJw937DxpeolaGIWAln8MV58Zkq2TtE4gwPk3RGxRWiXz_Cz4Rj8EcbEjn9yw5aQSd1X2ROjmn73zUsB_0J2rZtYlM1taigb9UZm_woZ_-UrtlVAiIAw0Wvfzy5gJKIS8xPIV9kkfPndfrD7yKOQMc7brC5XSQdYQbKl5H7X12eF",
    "qi": "mTTp2Yi-J6ltelSKq0BIsuc6AQ6VZ0BT913AT9c2qxVJLBn_hkDCerZqkpVx1KlgzZD6n4zcQQjben4IEEzgGRvW3HWJGCQLHgIEp7ifE2USjJz64Rmqvch-BdPzPDrJapYglDWKkc0WdfQaKNPQgvGCl_oLSUuz0hHyFDlZQXcsvJ0eRbZKQutGf12SguIRFbx310P_gLcZtKeYtlnI7PtyBIYl1KIjS7Eo0IlUiHDPk5dneS2ioK9gAEUEmwQ",
    "use": "sig",
    "kid": "4b37a76a0d0e5e0e529c0092c3832287"
}
EOF
}

# tls-gateway trust domain
create_ca "Mock Data Holder TLS Root CA" "$OUTPUT_DIR/tls-gateway" "87600h"
create_leaf "tls-server" "$OUTPUT_DIR/tls-gateway" "tls-server" "$OUTPUT_DIR/tls-gateway" "43824h" \
  --san localhost \
  --san authserver.mock \
  --san cdr-auth-server \
  --san tls-gateway
copy_leaf_alias "$OUTPUT_DIR/tls-gateway" "tls-server" "dsb-server"

# mtls-gateway trust domain
create_ca "Mock Data Holder mTLS Root CA" "$OUTPUT_DIR/mtls-gateway" "87600h"
create_leaf "cdr-auth-server-mtls" "$OUTPUT_DIR/mtls-gateway" "mtls-server" "$OUTPUT_DIR/mtls-gateway" "43824h" \
  --san localhost \
  --san authserver.mock \
  --san cdr-auth-server \
  --san mtls-gateway
create_leaf "MockDataRecipient" "$OUTPUT_DIR/mtls-gateway" "client" "$OUTPUT_DIR/mtls-gateway" "43824h"
copy_leaf_alias "$OUTPUT_DIR/mtls-gateway" "mtls-server" "dsb-server"

# mock-data-holder trust domains
create_ca "Mock Data Holder mTLS Root CA" "$OUTPUT_DIR/mock-data-holder/mtls" "87600h"
create_leaf "register.mock" "$OUTPUT_DIR/mock-data-holder/mtls" "server" "$OUTPUT_DIR/mock-data-holder/mtls" "43824h" \
  --san localhost \
  --san register.mock
create_leaf "MockDataRecipient" "$OUTPUT_DIR/mock-data-holder/mtls" "client" "$OUTPUT_DIR/mock-data-holder/mtls" "9600h"

create_ca "Mock Data Holder TLS Root CA" "$OUTPUT_DIR/mock-data-holder/tls" "87600h"
create_leaf "mock-data-holder" "$OUTPUT_DIR/mock-data-holder/tls" "mock-data-holder" "$OUTPUT_DIR/mock-data-holder/tls" "43824h" \
  --san mock-data-holder \
  --san localhost
copy_leaf_alias "$OUTPUT_DIR/mock-data-holder/tls" "mock-data-holder" "dsb-server"
write_mock_data_holder_jwks

# mock-data-recipient certs (signed from mock-data-holder mTLS CA)
mkdir -p "$OUTPUT_DIR/mock-data-recipient/mtls" "$OUTPUT_DIR/mock-data-recipient/tls"
cp "$OUTPUT_DIR/mock-data-holder/mtls/ca.crt" "$OUTPUT_DIR/mock-data-recipient/mtls/ca.crt"
cp "$OUTPUT_DIR/mock-data-holder/mtls/ca.pem" "$OUTPUT_DIR/mock-data-recipient/mtls/ca.pem"
cp "$OUTPUT_DIR/mock-data-holder/mtls/ca.key" "$OUTPUT_DIR/mock-data-recipient/mtls/ca.key"
create_leaf "MockDataRecipient" "$OUTPUT_DIR/mock-data-recipient/mtls" "client" "$OUTPUT_DIR/mock-data-recipient/mtls" "43824h"
create_leaf "mock-data-recipient" "$OUTPUT_DIR/mock-data-recipient/tls" "mock-data-recipient" "$OUTPUT_DIR/mock-data-recipient/mtls" "43824h" \
  --san mock-data-recipient \
  --san localhost

# mock-register trust domains
create_ca "Mock Register mTLS Root CA" "$OUTPUT_DIR/mock-register/mtls" "87600h"
create_leaf "register.mock" "$OUTPUT_DIR/mock-register/mtls" "server" "$OUTPUT_DIR/mock-register/mtls" "43824h" \
  --san localhost \
  --san register.mock
create_leaf "mock-data-holder-energy" "$OUTPUT_DIR/mock-register/mtls" "server-energy" "$OUTPUT_DIR/mock-register/mtls" "43824h" \
  --san mock-data-holder-energy \
  --san localhost
create_leaf "register.mock" "$OUTPUT_DIR/mock-register/mtls" "register" "$OUTPUT_DIR/mock-register/mtls" "43824h" \
  --san localhost \
  --san register.mock
create_leaf "register.mock" "$OUTPUT_DIR/mock-register/mtls" "register-client" "$OUTPUT_DIR/mock-register/mtls" "43824h" \
  --san localhost \
  --san register.mock
create_leaf "MockDataRecipient" "$OUTPUT_DIR/mock-register/mtls" "client" "$OUTPUT_DIR/mock-register/mtls" "43824h"
create_leaf "AdditionalClientCertForTesting" "$OUTPUT_DIR/mock-register/mtls" "client-additional" "$OUTPUT_DIR/mock-register/mtls" "43824h"
create_leaf "InvalidClientCertForTesting" "$OUTPUT_DIR/mock-register/mtls" "client-invalid" "$OUTPUT_DIR/mock-register/mtls" "24h"

create_leaf "mock-register" "$OUTPUT_DIR/mock-register/tls" "mock-register" "$OUTPUT_DIR/mock-register/mtls" "43824h" \
  --san mock-register \
  --san localhost
create_leaf "mock-data-holder" "$OUTPUT_DIR/mock-register/tls" "mock-data-holder" "$OUTPUT_DIR/mock-register/mtls" "43824h" \
  --san mock-data-holder \
  --san localhost
create_leaf "mock-data-holder-energy" "$OUTPUT_DIR/mock-register/tls" "mock-data-holder-energy" "$OUTPUT_DIR/mock-register/mtls" "43824h" \
  --san mock-data-holder-energy \
  --san localhost
create_leaf "mock-data-recipient" "$OUTPUT_DIR/mock-register/tls" "mock-data-recipient" "$OUTPUT_DIR/mock-register/mtls" "43824h" \
  --san mock-data-recipient \
  --san localhost
create_leaf "localhost" "$OUTPUT_DIR/mock-register/tls" "tls-template" "$OUTPUT_DIR/mock-register/mtls" "9600h" \
  --san localhost

create_self_signed_leaf "MockRegisterSSA" "$OUTPUT_DIR/mock-register/ssa" "ssa" "43824h" \
  --san mockregister.ssa

# cdr-auth-server trust domain
create_ca "CDR Auth Server mTLS Root CA" "$OUTPUT_DIR/cdr-auth-server/mtls" "87600h"
create_leaf "cdr-auth-server-mtls" "$OUTPUT_DIR/cdr-auth-server/mtls" "mtls-server" "$OUTPUT_DIR/cdr-auth-server/mtls" "43824h" \
  --san localhost \
  --san authserver.mock \
  --san cdr-auth-server \
  --san mtls-server

create_leaf "localhost" "$OUTPUT_DIR/cdr-auth-server/tls" "tls-server" "$OUTPUT_DIR/cdr-auth-server/mtls" "43824h" \
  --san localhost \
  --san authserver.mock \
  --san cdr-auth-server \
  --san tls-server

mkdir -p "$OUTPUT_DIR/cdr-auth-server/nginx/ssl"
cp "$OUTPUT_DIR/cdr-auth-server/mtls/ca.key" "$OUTPUT_DIR/cdr-auth-server/nginx/ssl/ca.key"
cp "$OUTPUT_DIR/cdr-auth-server/mtls/ca.pem" "$OUTPUT_DIR/cdr-auth-server/nginx/ssl/ca.pem"
cp "$OUTPUT_DIR/cdr-auth-server/mtls/ca.crt" "$OUTPUT_DIR/cdr-auth-server/nginx/ssl/ca.crt"
create_leaf "authserver-ui" "$OUTPUT_DIR/cdr-auth-server/nginx/ssl" "authserver-ui" "$OUTPUT_DIR/cdr-auth-server/mtls" "87600h" \
  --san authserver-ui \
  --san localhost \
  --san mock-data-holder \
  --san mock-data-holder-energy \
  --san auth-server

echo "Generated certificates in $OUTPUT_DIR"