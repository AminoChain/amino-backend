import cors from 'cors'
import {BigNumberish, BytesLike, CallOverrides, Contract, ContractTransaction, ethers, Overrides} from 'ethers'
import express, {Application, raw, Request, Response} from 'express'
// @ts-ignore
import AminoChainAuthenticatorArtifact from './artifacts/AminoChainAuthenticator.sol/AminoChainAuthenticator.json'
import { AminoChainAuthenticator } from '../../amino-contracts/typechain/contracts'
import {Encryptor} from "./encryptor";

import * as dotenv from 'dotenv'
import {getFilesFromPath, Web3Storage} from "web3.storage";
import * as fs from "fs"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { open } from 'node:fs/promises';
import {arrayify, recoverAddress} from "ethers/lib/utils";

dotenv.config()

const app: Application = express()

const port = process.env.PORT || 3003
const platformWalletPk = 'dc5007a9fc7f26997728e0738f21d8b276391b8a533fa134b149e143d7d1e21f'
export const hlaEncodingKey = 'secret'//platformWalletPk

export interface HLAHashed {
    A: string
    B: string
    C: string
    DPB: string
    DRB: string
}

export interface HLA {
    A: number[]
    B: number[]
    C: number[]
    DPB: number[]
    DRB: number[]
}

interface BiobankRegistrationData {
    hla: HLA,
    biobankAddress: string,
    donorAddress: string,
    amounts: number[],
    signature: string,
    genome: string
}

export type PromiseOrValue<T> = T | Promise<T>;

app.use(express.json())
// app.use(express.raw())
app.use(cors())

const encryptor = new Encryptor(hlaEncodingKey)


app.post('/register-donation', async (req: Request, res: Response) => {
    res.status(200).end()
    return

    const data = req.body as BiobankRegistrationData
    const { hla, amounts, biobankAddress, donorAddress, genome, signature} = data

    const authenticator = await getAuthenticatorContract()

    const hlaHash = ethers.utils.id(JSON.stringify(hla))

    // reduce long operation
    const registrationParametersHash = '0xa83a0d199caab0a87cbc094b8a88acb6b570176ad5cb374cf576768712b52151'
    /*const registrationParametersHash = await authenticator.getRegistrationHash(
        donorAddress,
        hlaHash
    )*/

    const digest = arrayify(registrationParametersHash)
    const recoveredAddress = recoverAddress(digest, signature)

    if (recoveredAddress.localeCompare(donorAddress) !== 1) {
        res.status(403)
        return
    }

    // reduce long operation
    // const genomeEncodedIpfsId = await uploadGenomeToIpfs(genome)
    const genomeEncodedIpfsId = 'bafybeihfkmtsraiwkdkb7pc7ltmmsiqawoozzbjtcanilbykpv6trj5m7y'

    // reduce long operation
    const hlaEncoded = mockHlaEncoded
    // const hlaEncoded = encryptor.encrypt(JSON.stringify(hla))

    // reduce long operation
    const hlaHashed = {
        "A": "0xb4ff4867cc79126826f7a227459583daf153a4c06ebe46aa70d02b5edf79bf90",
        "B": "0x4f78dcb8885880abdd79a0ee42acd93e663070f9f26bc0fc0c5f286292ed80b8",
        "C": "0x91a4b0333b4164454a16c893710e4d93be09adce949dd57b62045d9702889926",
        "DPB": "0x2bf8860cf9668ead6525698f0457f7848f42305ccbc59f6880f5eee34ac8283f",
        "DRB": "0x8a2488f5299e815401467583e7495c69909605d3670c05471bc064e9d0938228"
    }
    /*const hlaHashed = {
        A: ethers.utils.id(hla.A.toString()), // use ethers.utils.id instead
        B: ethers.utils.id(hla.B.toString()),
        C: ethers.utils.id(hla.C.toString()),
        DPB: ethers.utils.id(hla.DPB.toString()),
        DRB: ethers.utils.id(hla.DRB.toString()),
    }*/

    try {
        const tx = await authenticator.register({
            hlaHashed,
            hlaHash,
            hlaEncoded,
            genomeEncodedIpfsId, //: 'bafybeihfkmtsraiwkdkb7pc7ltmmsiqawoozzbjtcanilbykpv6trj5m7y', // encode and upload `genome` to IPFS
            amounts,
            donor: donorAddress,
            biobank: biobankAddress
        }, { gasLimit: 100_000 })
        // const receipt = await tx.wait()
        console.log('Registration tx: '+tx.hash)
        res.status(200).send(tx.hash)
    } catch (e) {
        console.error(e)
        res.status(500)
    }



    // res.status(200).send( biodataHash)

    // res.setHeader('Content-Type', 'application/json');
    // res.end(JSON.stringify({ ...bioData, secret }))
})

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

app.get('/get-bio-data/:biodataHash', async (req: Request, res: Response) => {
    const { biodataHash} = req.params

    /*const authenticator = await getAuthenticatorContract()

    const storedBioDataEncoded = await authenticator.bioDataEncoded(biodataHash)
    if (storedBioDataEncoded === '0x') {
        res.status(200).send('')
    } else {
        const storedBioData = encryptor.decrypt(ethers.utils.arrayify(storedBioDataEncoded))

        res.status(200).send(storedBioData)
    }*/
})

const server = app.listen(port, function () {
    console.log(`App is listening on port http://localhost:${port} !`)
})

async function getAuthenticatorContract() {
    const provider = new ethers.providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com')
    const signer = new ethers.Wallet(platformWalletPk, provider)

    const contract = new Contract(
        '0xad6414d5209B667Cf24BFf21DBa25b56274759C5',
        AminoChainAuthenticatorArtifact.abi,
        signer
    )
    return await contract.deployed() as unknown as AminoChainAuthenticator
}


export async function uploadGenomeToIpfs(genome: string) {
    const web3StorageApi = process.env.WEB3_STORAGE_TOKEN! // get token from https://web3.storage/tokens/ and set into .env
    const storage = new Web3Storage({ token: web3StorageApi })

    const genomeEncoded = encryptor.encrypt(genome)

    fs.writeFile('file',genomeEncoded, (error) => {
        console.error(error)
    })

    const files = await getFilesFromPath('file')


    // const data = new Blob([genomeEncoded], { type: 'application/octet-stream' });

    // const file = new File([genomeEncoded.buffer], 'genome.encoded.txt')
    // const cid = await storage.put([file]);

    const cid = await storage.put(files)

    console.log(cid)
    return cid as string
}

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
])