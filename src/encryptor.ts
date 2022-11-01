import {ModeOfOperation, padding, utils} from "aes-js";

const iv = utils.utf8.toBytes("IVMustBe16Bytes.")

export class Encryptor {
    private readonly keyBytes: Uint8Array;

    constructor(key: string) {
        this.keyBytes = padding.pkcs7.pad(utils.utf8.toBytes(key))
    }

    encrypt(data: string): Uint8Array {
        const dataInBytes = utils.utf8.toBytes(data)
        const dataInPaddedBytes = padding.pkcs7.pad(dataInBytes)

        const aesCbc1 = new ModeOfOperation.cbc(this.keyBytes, iv)
        return aesCbc1.encrypt(dataInPaddedBytes)
    }

    decrypt(encryptedBytes: Uint8Array): string {
        const aesCbc2 = new ModeOfOperation.cbc(this.keyBytes, iv)
        const decryptedBytes = aesCbc2.decrypt(encryptedBytes)
        const decryptedStripedBytes = padding.pkcs7.strip(decryptedBytes)
        return utils.utf8.fromBytes(decryptedStripedBytes)
    }

    /*decrypt(encryptedString: string): string {
        const aesCbc2 = new ModeOfOperation.cbc(this.keyBytes, iv)
        const encryptedBytes = utils.utf8.toBytes(encryptedString)
        const decryptedBytes = aesCbc2.decrypt(encryptedBytes)
        const decryptedStripedBytes = padding.pkcs7.strip(decryptedBytes)
        return utils.utf8.fromBytes(decryptedStripedBytes)
    }*/
}