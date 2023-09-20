openssl req -new -newkey rsa:2048 -keyout tls-server.key -sha256 -nodes -out tls-server.csr -config tls-server.cnf
openssl req -in tls-server.csr -noout -text
openssl x509 -req -days 1826 -in tls-server.csr -CA ca.pem -CAkey ca.key -CAcreateserial -out tls-server.pem -extfile tls-server.ext
openssl pkcs12 -inkey tls-server.key -in tls-server.pem -export -out tls-server.pfx