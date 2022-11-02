"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Encryptor = void 0;
const aes_js_1 = require("aes-js");
const iv = aes_js_1.utils.utf8.toBytes("IVMustBe16Bytes.");
class Encryptor {
    constructor(key) {
        this.keyBytes = aes_js_1.padding.pkcs7.pad(aes_js_1.utils.utf8.toBytes(key));
    }
    encrypt(data) {
        const dataInBytes = aes_js_1.utils.utf8.toBytes(data);
        const dataInPaddedBytes = aes_js_1.padding.pkcs7.pad(dataInBytes);
        const aesCbc1 = new aes_js_1.ModeOfOperation.cbc(this.keyBytes, iv);
        return aesCbc1.encrypt(dataInPaddedBytes);
    }
    decrypt(encryptedBytes) {
        const aesCbc2 = new aes_js_1.ModeOfOperation.cbc(this.keyBytes, iv);
        const decryptedBytes = aesCbc2.decrypt(encryptedBytes);
        const decryptedStripedBytes = aes_js_1.padding.pkcs7.strip(decryptedBytes);
        return aes_js_1.utils.utf8.fromBytes(decryptedStripedBytes);
    }
}
exports.Encryptor = Encryptor;
