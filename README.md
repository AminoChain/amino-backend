Deployed on https://amino-chain-backend.herokuapp.com

# POST `/register-donation` 
called by protocol owner with body:

```typescript
interface BiobankRegistrationData {
    hla: HLA,
    biobankAddress: string,
    donorAddress: string,
    amounts: number[],
    signature: string,
    genome: string
}
```
`amounts` -- array of donation fractions in CC. Example: [10, 5, 5, 2, 2, 2, 2, 2] or [30] <br />
`signature` -- donor should sign message to prove identity. Check example below <br />
`genome` -- full genome and donor info

HLA and genome data encrypted by `src/encryptor.ts` tool. Genome data uploads to IPFS by `uploadGenomeToIpfs` function. 
To prevent biobank fraud we need to have signature of made by donor wallet. Signature made WalletConnect library, sample code:

```typescript
const authenticator = new Contract(
    contractAddress,
    abis.authenticator,
    new ethers.providers.JsonRpcProvider('https://rpc-mumbai.matic.today')
)

let hlaHash = ethers.utils.id(JSON.stringify(hla))
const registrationParametersHash = await authenticator.getRegistrationHash(donorAddress, hlaHash)

connector // from WalletConnect
    .signMessage([account, registrationParametersHash])
    .then(async (signature) => {
        const response = await fetch(platformBackend + `register-donation`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                hla,
                biobankAddress,
                donorAddress,
                amounts,
                signature,
                genome,
            }),
        })
    })
```
Full code in UI repo `components/biobank/appointments/register/donorApprovePage/DonorApprovePage.jsx`

Returns `txHash`


# GET `/decode-hla/:tokenId` 
called by marketplace UI. HLA decrypted by `src/encryptor.ts` tool. Returns raw HLA data:
```typescript
interface HLA {
    A: number[]
    B: number[]
    C: number[]
    DPB: number[]
    DRB: number[]
}
```

# GET `/decode-genome/:tokenId` 
called by marketplace UI. Genome decrypted by `src/encryptor.ts` tool. Returns raw genome/donor data as string

# GET `/is-it-doctor-or-researcher-address/:address` 
called by [AminoChainMarketplace](https://github.com/AminoChain/amino-contracts/blob/master/contracts/AminoChainMarketplace.sol) smart contract, returns json:
```json
{ doctor: true|false }
```

# Notes 

Run `yarn update-build` to update `build` folder

Admin suite https://dashboard.heroku.com/apps/amino-chain-backend