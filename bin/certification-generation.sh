#!/bin/bash

#for server
openssl req -newkey rsa:4096 -x509 -sha256 -days 3650 -nodes -out ../cert/server.crt -keyout ../cert/server-private.crf
openssl x509 -pubkey -noout -in ../cert/server.crt  > ../cert/server-public.crf

#for client
openssl req -newkey rsa:4096 -x509 -sha256 -days 3650 -nodes -out ../cert/client.crt -keyout ../cert/client-private.crf
openssl x509 -pubkey -noout -in ../cert/client.crt  > ../cert/client-public.crf