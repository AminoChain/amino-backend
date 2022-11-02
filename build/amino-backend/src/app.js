"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const ethers_1 = require("ethers");
const express_1 = __importDefault(require("express"));
// @ts-ignore
const AminoChainAuthenticator_json_1 = __importDefault(require("./artifacts/AminoChainAuthenticator.sol/AminoChainAuthenticator.json"));
const encryptor_1 = require("./encryptor");
const app = (0, express_1.default)();
const port = process.env.PORT || 3003;
const platformWalletPk = '0e1c192d251e4b9de9f2c0218b4e10e710d7053157e48d41de28cac5757c6300'; // same as biobank PK for tests
const hlaEncodingKey = 'secret'; //platformWalletPk
app.use(express_1.default.json());
// app.use(express.raw())
app.use((0, cors_1.default)());
const storage = {};
const encryptor = new encryptor_1.Encryptor(hlaEncodingKey);
app.post('/register-donation-from-biobank', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const { biodataHash } = req.params
    const data = req.body;
    const authenticator = yield getAuthenticatorContract();
    const biodataHash = yield authenticator.getBioDataHash(data.hla.A.toString(), data.hla.B.toString(), data.hla.C.toString(), data.hla.DPB.toString(), data.hla.DRB.toString());
    storage[biodataHash] = data;
    res.status(200).send(biodataHash);
    // res.setHeader('Content-Type', 'application/json');
    // res.end(JSON.stringify({ ...bioData, secret }))
}));
app.post('/approve-donation/:biodataHash/:donorAddress', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { biodataHash, donorAddress } = req.params;
        const { signature } = req.body;
        const data = storage[biodataHash];
        if (data) {
            const { hla, amounts, biobankAddress } = data;
            const authenticator = yield getAuthenticatorContract();
            const bioDataHashed = {
                A: yield authenticator.hash(hla.A.toString()),
                B: yield authenticator.hash(hla.B.toString()),
                C: yield authenticator.hash(hla.C.toString()),
                DPB: yield authenticator.hash(hla.DPB.toString()),
                DRB: yield authenticator.hash(hla.DRB.toString()),
            };
            const biodataEncoded = encryptor.encrypt(JSON.stringify(hla));
            try {
                const tx = yield authenticator.register(bioDataHashed, biodataHash, biodataEncoded, //ethers.constants.HashZero
                amounts, donorAddress, signature, biobankAddress, { gasLimit: 200000 });
                const receipt = yield tx.wait();
                console.log('Registration tx: ' + tx.hash);
            }
            catch (e) {
                throw e;
            }
            res.sendStatus(200);
        }
        else {
            console.error('No data for biodataHash: ' + biodataHash);
            res.status(500);
        }
    }
    catch (e) {
        console.error(e);
        res.status(500);
    }
}));
app.get('/get-bio-data/:biodataHash', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { biodataHash } = req.params;
    const authenticator = yield getAuthenticatorContract();
    const storedBioDataEncoded = yield authenticator.bioDataEncoded(biodataHash);
    if (storedBioDataEncoded === '0x') {
        res.status(200).send('');
    }
    else {
        const storedBioData = encryptor.decrypt(ethers_1.ethers.utils.arrayify(storedBioDataEncoded));
        res.status(200).send(storedBioData);
    }
}));
app.listen(port, function () {
    console.log(`App is listening on port http://localhost:${port} !`);
});
function getAuthenticatorContract() {
    return __awaiter(this, void 0, void 0, function* () {
        const provider = new ethers_1.ethers.providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com');
        const signer = new ethers_1.ethers.Wallet(platformWalletPk, provider);
        const contract = new ethers_1.Contract('0xefAB5852961678E66b2ce3068d8138B88Ba947F0', AminoChainAuthenticator_json_1.default.abi, signer);
        return yield contract.deployed();
    });
}
