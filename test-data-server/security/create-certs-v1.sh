

# create the certificate signign request
openssl x509 -text -noout -in master-v1.crt 
openssl req -new -key master-v1.key -out master-v1.csr -config master-ssl1.conf
# verify the alt names in the certificate
openssl req -noout -text -in master-v1.csr| grep -A 1 "Subject Alternative Name"

 # sign the request with ACCC CA, note the -copy_extension, which is required to get the alternate names working
openssl x509 -req -days 365 -in master-v1.csr -CA ./ca/ca.crt -CAkey ./ca/ca.key -CAcreateserial -out master-v1.crt -extensions req_ext -extfile master-ssl1.conf
# verify the alt names in the certificate
openssl x509 -text -noout -in master-v1.crt | grep -A 1 "Subject Alternative Name"

# create a pfx file
openssl pkcs12 -export -out ./master-v1.pfx -inkey ./master-v1.key -in ./master-v1.crt

# extract the certificate from the pfx file
# openssl pkcs12 -in master-v1.pfx -clcerts -nokeys -out extracted.crt
# openssl x509 -text -noout -in extracted.crt | grep -A 1 "Subject Alternative Name"