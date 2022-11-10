"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.uploadGenomeToIpfs = exports.hlaEncodingKey = void 0;
const cors_1 = __importDefault(require("cors"));
const ethers_1 = require("ethers");
const express_1 = __importDefault(require("express"));
// @ts-ignore
const AminoChainAuthenticator_json_1 = __importDefault(require("./artifacts/AminoChainAuthenticator.sol/AminoChainAuthenticator.json"));
const AminoChainDonation_json_1 = __importDefault(require("./artifacts/AminoChainDonation.sol/AminoChainDonation.json"));
const encryptor_1 = require("./encryptor");
const dotenv = __importStar(require("dotenv"));
const web3_storage_1 = require("web3.storage");
const fs = __importStar(require("fs")); // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
const utils_1 = require("ethers/lib/utils");
dotenv.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3003;
const platformWalletPk = 'dc5007a9fc7f26997728e0738f21d8b276391b8a533fa134b149e143d7d1e21f';
exports.hlaEncodingKey = 'secret'; //platformWalletPk
app.use(express_1.default.json());
// app.use(express.raw())
app.use((0, cors_1.default)());
const encryptor = new encryptor_1.Encryptor(exports.hlaEncodingKey);
app.post('/register-donation', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = req.body;
    const { hla, amounts, biobankAddress, donorAddress, genome, signature } = data;
    const authenticator = yield getAuthenticatorContract();
    const hlaHash = ethers_1.ethers.utils.id(JSON.stringify(hla));
    const registrationParametersHash = yield authenticator.getRegistrationHash(donorAddress, hlaHash);
    const digest = (0, utils_1.arrayify)(registrationParametersHash);
    const recoveredAddress = (0, utils_1.recoverAddress)(digest, signature);
    if (recoveredAddress.toLowerCase() != donorAddress.toLowerCase()) {
        console.log(`hlaHash: ${hlaHash}\nregistrationParametersHash: ${registrationParametersHash}\nrecoveredAddress: ${recoveredAddress} != \ndonorAddress: ${donorAddress}`);
        res.status(403).end();
        return;
    }
    const hlaEncoded = encryptor.encrypt(JSON.stringify(hla));
    const genomeEncodedIpfsId = yield uploadGenomeToIpfs(genome);
    const hlaHashed = {
        A: ethers_1.ethers.utils.id(hla.A.toString()),
        B: ethers_1.ethers.utils.id(hla.B.toString()),
        C: ethers_1.ethers.utils.id(hla.C.toString()),
        DPB: ethers_1.ethers.utils.id(hla.DPB.toString()),
        DRB: ethers_1.ethers.utils.id(hla.DRB.toString()),
    };
    try {
        const tx = yield authenticator.register({
            hlaHashed,
            hlaHash,
            hlaEncoded,
            genomeEncodedIpfsId,
            amounts,
            donor: donorAddress,
            biobank: biobankAddress
        });
        // reduce long operation because timeout could be reach
        // const receipt = await tx.wait()
        console.log('Registration tx: ' + tx.hash);
        res.status(200).end(tx.hash);
    }
    catch (e) {
        console.error(e);
        res.status(500).end();
    }
}));
/*app.post('/approve-donation/:biodataHash/:donorAddress', async (req: Request, res: Response) => {
    try {
        const {biodataHash, donorAddress} = req.params

        const {signature} = req.body
        const data = storage[biodataHash]
        if (data) {
            const { hla, amounts, biobankAddress} = data

            const authenticator = await getAuthenticatorContract()

            const bioDataHashed = {
                A: ethers.utils.id(hla.A.toString()),
                B: ethers.utils.id(hla.B.toString()),
                C: ethers.utils.id(hla.C.toString()),
                DPB: ethers.utils.id(hla.DPB.toString()),
                DRB: ethers.utils.id(hla.DRB.toString()),
            }

            const biodataEncoded = encryptor.encrypt(JSON.stringify(hla))

            try {
                const tx = await authenticator.register(
                    bioDataHashed,
                    biodataHash,
                    biodataEncoded, //ethers.constants.HashZero
                    amounts,
                    donorAddress,
                    signature,
                    biobankAddress,
                    { gasLimit: 200_000 }
                )
                const receipt = await tx.wait()
                console.log('Registration tx: '+tx.hash)
            } catch (e) {
                throw e
            }

            res.sendStatus(200)
        } else {
            console.error('No data for biodataHash: '+biodataHash)
            res.status(500)
        }
    } catch (e) {
        console.error(e)
        res.status(500)
    }
})*/
app.get('/decode-hla/:tokenId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tokenId } = req.params;
    const nft = yield getNftContract();
    const hlaEncoded = yield nft.getHlaEncoded(tokenId);
    if (hlaEncoded === '0x') {
        res.status(200).send('').end();
    }
    else {
        const hla = encryptor.decrypt(ethers_1.ethers.utils.arrayify(hlaEncoded));
        res.setHeader('Content-Type', 'application/json');
        res.end(hla);
    }
}));
app.get('/decode-genome/:tokenId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tokenId } = req.params;
    const nft = yield getNftContract();
    const genomeEncodedIpfsId = yield nft.getGenomeEncodedUrl(tokenId);
    if (genomeEncodedIpfsId === '') {
        res.status(200).end();
    }
    else {
        const url = `https://${genomeEncodedIpfsId}.ipfs.w3s.link/ipfs/${genomeEncodedIpfsId}/file`;
        const response = yield fetch(url);
        const encoded = yield response.arrayBuffer();
        const decoded = encryptor.decrypt(new Uint8Array(encoded));
        res.status(200).send(decoded).end();
    }
}));
app.listen(port, function () {
    console.log(`App is listening on port http://localhost:${port} !`);
});
const provider = new ethers_1.ethers.providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com');
const signer = new ethers_1.ethers.Wallet(platformWalletPk, provider);
function getAuthenticatorContract() {
    return __awaiter(this, void 0, void 0, function* () {
        const contract = new ethers_1.Contract('0xe678C9BA5a9aE61fAc009a602b29ed869eD8156c', AminoChainAuthenticator_json_1.default.abi, signer);
        return yield contract.deployed();
    });
}
function getNftContract() {
    return __awaiter(this, void 0, void 0, function* () {
        const contract = new ethers_1.Contract('0x3dfF52834c6f242437Fc4bB960823b1a97Ab0aBC', AminoChainDonation_json_1.default.abi, signer);
        return yield contract.deployed();
    });
}
function uploadGenomeToIpfs(genome) {
    return __awaiter(this, void 0, void 0, function* () {
        const web3StorageApi = process.env.WEB3_STORAGE_TOKEN; // get token from https://web3.storage/tokens/ and set into .env
        const storage = new web3_storage_1.Web3Storage({ token: web3StorageApi });
        const genomeEncoded = encryptor.encrypt(genome);
        fs.writeFile('file', genomeEncoded, (error) => {
            console.error(error);
        });
        const files = yield (0, web3_storage_1.getFilesFromPath)('file');
        // const data = new Blob([genomeEncoded], { type: 'application/octet-stream' });
        // const file = new File([genomeEncoded.buffer], 'genome.encoded.txt')
        // const cid = await storage.put([file]);
        const cid = yield storage.put(files);
        console.log(cid);
        return cid;
    });
}
exports.uploadGenomeToIpfs = uploadGenomeToIpfs;
