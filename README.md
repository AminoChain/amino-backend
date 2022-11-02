https://amino-chain-backend.herokuapp.com

POST `/register-donation-from-biobank` called by biobank with body:
```typescript
interface BiobankRegistrationData {
    hla: HLA,
    biobankAddress: string,
    amounts: number[]
}
```
returns `biodataHash`


POST `/approve-donation/:biodataHash/:donorAddress` called by authenticator UI with body:
```typescript
interface Signature {
    "signature": string
}
```

GET `/get-bio-data/:biodataHash` called by marketplace UI, returns raw HLA data:
```typescript
interface HLA {
    A: number[]
    B: number[]
    C: number[]
    DPB: number[]
    DRB: number[]
}
```

Use `tsc` command to update `build` folder

Admin suite https://dashboard.heroku.com/apps/amino-chain-backend