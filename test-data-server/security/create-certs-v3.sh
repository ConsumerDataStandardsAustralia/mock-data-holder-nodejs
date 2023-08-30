
# create the certificate signign request
/usr/local/Cellar/openssl@3/3.1.2/bin/openssl req -new -out master-v3.csr -newkey rsa:2048 -nodes -sha256 -keyout master-v3.key -config ./master-ssl3.conf
 # sign the request with ACCC CA, note the -copy_extension, which is required to get the alternate names working
 # the ca files are copies from the ACCC repos
/usr/local/Cellar/openssl@3/3.1.2/bin/openssl x509 -req -in ./master-v3.csr -CA ./ca/ca.crt -CAkey ./ca/ca.key -CAcreateserial -out ./master-v3.crt -days 500 -sha256  -copy_extensions copyAll
# create a pfx file
/usr/local/Cellar/openssl@3/3.1.2/bin/openssl pkcs12 -export -out ./master-v3.pfx -inkey ./master-v3.key -in ./master-v3.crt

/usr/local/Cellar/openssl@3/3.1.2/bin/openssl x509 -text -noout -in master-v3.crt 

