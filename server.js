const WebSocket = require('ws');
const fs = require('fs');
const constants = require('constants');
const padding = constants.RSA_PKCS1_PADDING;
const crypto = require('crypto');
const Config = require("./config.js");

cert_server_private = fs.readFileSync("./cert/server-private.crf", "utf-8");
cert_server_public = fs.readFileSync("./cert/server-public.crf", "utf-8");

cert_client_private = fs.readFileSync("./cert/client-private.crf", "utf-8");
cert_client_public = fs.readFileSync("./cert/client-public.crf", "utf-8");

const WebSocketServer = new WebSocket.Server({ port: Config.port });

let sockets = [];
WebSocketServer.on('connection', ws => {
    ws.slot=sockets.length;
    sockets.push(ws);

    //Отправляем публичный сертификат
    let packet = {
        type: "certification",
        encrypt: cert_server_private,
        decrypt: cert_client_public,
    };
    ws.send(JSON.stringify(packet));

    //Получение нового сообщения
    ws.on('message', message => {
        try {
            let data = JSON.parse(message);
            console.log(data);

            switch (data.type) {
                case "new_client":
                    sockets[ws.slot].nickname = data.nickname;
                    break;
                case "message":
                    if (sockets[ws.slot].nickname !== undefined) {
                        message = Decrypt(data.message).toString();
                        let obj = {
                            nickname: sockets[ws.slot].nickname,
                            message: Encrypt(message),
                        };
                        sendAll(obj);
                    }
                    break;
            }
        } catch (e) {
            console.log("\x1b[31mmerror json format\x1b[0m", e);
        }
    });

    ws.on('close', function close() {
        ws.close();
        console.log('disconnected');
        sockets=remove(sockets, ws.slot);
    });
});

/////

function remove(arr, indexes) {
    let arrayOfIndexes = [].slice.call(arguments, 1);
    return arr.filter(function (item, index) {
        return arrayOfIndexes.indexOf(index) == -1;
    });
}

function Encrypt(message) {
    return crypto.privateEncrypt({ key: cert_client_private, padding: padding  }, new Buffer.from(message));
}

function Decrypt(sig) {
    return crypto.publicDecrypt({ key: cert_server_public, padding: padding  }, Buffer.from(sig));
}

function sendAll(obj){
    sockets.forEach((client)=>{
        if(client.readyState === WebSocket.OPEN){
            console.log(obj);
            let packet = {
                type:"message",
                nickname:obj.nickname,
                message:obj.message
            };
            client.send(JSON.stringify(packet));
        }
    });
}