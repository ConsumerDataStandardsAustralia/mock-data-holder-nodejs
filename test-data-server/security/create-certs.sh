
# create the certificate signign request
openssl req -new -out master.csr -newkey rsa:2048 -nodes -sha256 -keyout master.key -config ./master.conf
 # sign the request with ACCC CA, note the -copy_extension, which is required to get the alternate names working
 # the ca files are copies from the ACCC repos
openssl x509 -req -in ./master.csr -CA ./ca/ca.crt -CAkey ./ca/ca.key -CAcreateserial -out ./master.crt -days 500 -sha256 -ext subjectAltName -copy_extensions copy
# create a pfx file
openssl pkcs12 -export -out ./master.pfx -inkey ./master.key -in ./master.crt

openssl x509 -text -noout -in master.crt 

