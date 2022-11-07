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
    res.status(200).end();
    return;
    const data = req.body;
    const { hla, amounts, biobankAddress, donorAddress, genome, signature } = data;
    const authenticator = yield getAuthenticatorContract();
    const hlaHash = ethers_1.ethers.utils.id(JSON.stringify(hla));
    // reduce long operation
    const registrationParametersHash = '0xa83a0d199caab0a87cbc094b8a88acb6b570176ad5cb374cf576768712b52151';
    /*const registrationParametersHash = await authenticator.getRegistrationHash(
        donorAddress,
        hlaHash
    )*/
    const digest = (0, utils_1.arrayify)(registrationParametersHash);
    const recoveredAddress = (0, utils_1.recoverAddress)(digest, signature);
    if (recoveredAddress.localeCompare(donorAddress) !== 1) {
        res.status(403);
        return;
    }
    // reduce long operation
    // const genomeEncodedIpfsId = await uploadGenomeToIpfs(genome)
    const genomeEncodedIpfsId = 'bafybeihfkmtsraiwkdkb7pc7ltmmsiqawoozzbjtcanilbykpv6trj5m7y';
    // reduce long operation
    const hlaEncoded = mockHlaEncoded;
    // const hlaEncoded = encryptor.encrypt(JSON.stringify(hla))
    // reduce long operation
    const hlaHashed = {
        "A": "0xb4ff4867cc79126826f7a227459583daf153a4c06ebe46aa70d02b5edf79bf90",
        "B": "0x4f78dcb8885880abdd79a0ee42acd93e663070f9f26bc0fc0c5f286292ed80b8",
        "C": "0x91a4b0333b4164454a16c893710e4d93be09adce949dd57b62045d9702889926",
        "DPB": "0x2bf8860cf9668ead6525698f0457f7848f42305ccbc59f6880f5eee34ac8283f",
        "DRB": "0x8a2488f5299e815401467583e7495c69909605d3670c05471bc064e9d0938228"
    };
    /*const hlaHashed = {
        A: ethers.utils.id(hla.A.toString()), // use ethers.utils.id instead
        B: ethers.utils.id(hla.B.toString()),
        C: ethers.utils.id(hla.C.toString()),
        DPB: ethers.utils.id(hla.DPB.toString()),
        DRB: ethers.utils.id(hla.DRB.toString()),
    }*/
    try {
        const tx = yield authenticator.register({
            hlaHashed,
            hlaHash,
            hlaEncoded,
            genomeEncodedIpfsId,
            amounts,
            donor: donorAddress,
            biobank: biobankAddress
        }, { gasLimit: 100000 });
        // const receipt = await tx.wait()
        console.log('Registration tx: ' + tx.hash);
        res.status(200).send(tx.hash);
    }
    catch (e) {
        console.error(e);
        res.status(500);
    }
    // res.status(200).send( biodataHash)
    // res.setHeader('Content-Type', 'application/json');
    // res.end(JSON.stringify({ ...bioData, secret }))
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
app.get('/get-bio-data/:biodataHash', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { biodataHash } = req.params;
    /*const authenticator = await getAuthenticatorContract()

    const storedBioDataEncoded = await authenticator.bioDataEncoded(biodataHash)
    if (storedBioDataEncoded === '0x') {
        res.status(200).send('')
    } else {
        const storedBioData = encryptor.decrypt(ethers.utils.arrayify(storedBioDataEncoded))

        res.status(200).send(storedBioData)
    }*/
}));
const server = app.listen(port, function () {
    console.log(`App is listening on port http://localhost:${port} !`);
});
function getAuthenticatorContract() {
    return __awaiter(this, void 0, void 0, function* () {
        const provider = new ethers_1.ethers.providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com');
        const signer = new ethers_1.ethers.Wallet(platformWalletPk, provider);
        const contract = new ethers_1.Contract('0xad6414d5209B667Cf24BFf21DBa25b56274759C5', AminoChainAuthenticator_json_1.default.abi, signer);
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
const mockHlaEncoded = new Uint8Array([
    69,
    8,
    5,
    3,
    8,
    0,
    55,
    7,
    9,
    1,
    134,
    229,
    34,
    159,
    31,
    11,
    82,
    79,
    189,
    151,
    42,
    206,
    245,
    70,
    247,
    126,
    91,
    168,
    253,
    84,
    136,
    93,
    42,
    173,
    251,
    39,
    91,
    232,
    154,
    146,
    2,
    173,
    35,
    68,
    254,
    234,
    99,
    202,
    57,
    178,
    109,
    65,
    250,
    46,
    47,
    141,
    163,
    209,
    148,
    144,
    84,
    204,
    138,
    78,
    127,
    193,
    103,
    111,
    65,
    184,
    181,
    73,
    141,
    117,
    209,
    188,
    153,
    143,
    145,
    156
]);
