const crypto = require('crypto');
const constants = require('constants');
const padding = constants.RSA_PKCS1_PADDING;
const WebSocket = require('ws');
const readline = require('readline');
const Config = require("./config.js");

let cert_encrypt = '';
let cert_decrypt = ''
let nickname = '';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const ws = new WebSocket('ws://'+Config.host+":"+Config.port);

ws.on('open', () => {
    rl.question('What you nickname ? ', (answer) => {
        nickname = answer;
        let packet = {
            type: "new_client",
            nickname: nickname,
        };
        ws.send(JSON.stringify(packet), err => {
            if(!err) {
                console.log("!!! You are online !!!");
            }
        });
        writeMessage();
    });
});

ws.on('close', function close() {
    ws.close();
    console.log('Server is offline');
    process.exit(1);
});

ws.on('message',  message => {
    let data = JSON.parse(message);
    try{
        switch (data.type) {
            case "certification":
                cert_encrypt = data.encrypt;
                cert_decrypt = data.decrypt;
                break;
            case "message":
                let message = Decrypt(data.message).toString();
                console.log("#" + data.nickname + " > " + message);
                break;
        }
    } catch (e) {
        cosnole.log("\x1b[31mmerror json format\x1b[0m");
    }
});


/////

function writeMessage() {
    rl.question('', (answer) => {
        let message = answer;
        let packet = {
            type: "message",
            message: Encrypt(answer),
        };
        ws.send(JSON.stringify(packet));
        writeMessage();
    });
}

function Encrypt(message) {
    return crypto.privateEncrypt({ key: cert_encrypt, padding: padding  }, new Buffer.from(message));
}

function Decrypt(sig) {
    return crypto.publicDecrypt({ key: cert_decrypt, padding: padding  }, Buffer.from(sig));
}