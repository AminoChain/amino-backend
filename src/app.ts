import cors from 'cors'
import {BigNumberish, BytesLike, CallOverrides, Contract, ContractTransaction, ethers, Overrides} from 'ethers'
import express, {Application, raw, Request, Response} from 'express'
// @ts-ignore
import AminoChainAuthenticatorArtifact from '../../amino-contracts/artifacts/contracts/AminoChainAuthenticator.sol/AminoChainAuthenticator.json'
import { AminoChainAuthenticator } from '../../amino-contracts/typechain/contracts'
import {Encryptor} from "./encryptor";

const app: Application = express()

const port = process.env.PORT || 3003
const platformWalletPk = '0e1c192d251e4b9de9f2c0218b4e10e710d7053157e48d41de28cac5757c6300' // same as biobank PK for tests
const hlaEncodingKey = 'secret'//platformWalletPk

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
    amounts: number[]
}

export type PromiseOrValue<T> = T | Promise<T>;

app.use(express.json())
// app.use(express.raw())
app.use(cors())

const storage: {[key: string]: BiobankRegistrationData} = {}
const encryptor = new Encryptor(hlaEncodingKey)

app.post('/register-donation-from-biobank', async (req: Request, res: Response) => {
    // const { biodataHash } = req.params

    const data = req.body as BiobankRegistrationData

    const authenticator = await getAuthenticatorContract()

    const biodataHash = await authenticator.getBioDataHash(
        data.hla.A.toString(),
        data.hla.B.toString(),
        data.hla.C.toString(),
        data.hla.DPB.toString(),
        data.hla.DRB.toString()
    )

    storage[biodataHash] = data
    res.status(200).send( biodataHash)
    // res.setHeader('Content-Type', 'application/json');
    // res.end(JSON.stringify({ ...bioData, secret }))
})

app.post('/approve-donation/:biodataHash/:donorAddress', async (req: Request, res: Response) => {
    try {
        const {biodataHash, donorAddress} = req.params

        const {signature} = req.body
        const data = storage[biodataHash]
        if (data) {
            const { hla, amounts, biobankAddress} = data

            const authenticator = await getAuthenticatorContract()

            const bioDataHashed = {
                A: await authenticator.hash(hla.A.toString()),
                B: await authenticator.hash(hla.B.toString()),
                C: await authenticator.hash(hla.C.toString()),
                DPB: await authenticator.hash(hla.DPB.toString()),
                DRB: await authenticator.hash(hla.DRB.toString()),
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
})

app.get('/get-bio-data/:biodataHash', async (req: Request, res: Response) => {
    const { biodataHash} = req.params

    const authenticator = await getAuthenticatorContract()

    const storedBioDataEncoded = await authenticator.bioDataEncoded(biodataHash)
    if (storedBioDataEncoded === '0x') {
        res.status(200).send('')
    } else {
        const storedBioData = encryptor.decrypt(ethers.utils.arrayify(storedBioDataEncoded))

        res.status(200).send(storedBioData)
    }
})

app.listen(port, function () {
    console.log(`App is listening on port http://localhost:${port} !`)
})

async function getAuthenticatorContract() {
    const provider = new ethers.providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com')
    const signer = new ethers.Wallet(platformWalletPk, provider)

    const contract = new Contract(
        '0xefAB5852961678E66b2ce3068d8138B88Ba947F0',
        AminoChainAuthenticatorArtifact.abi,
        signer
    )
    return await contract.deployed() as unknown as AminoChainAuthenticator
}