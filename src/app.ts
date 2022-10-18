import express, { Application, Request, Response } from 'express'
import keccak256 from 'keccak256';
import {generate} from "./biodata-generator";

const app: Application = express()

const port = process.env.PORT || 3001

app.get('/bio-data', (req: Request, res: Response) => {
    const bioData = generate()
    const secret = keccak256(Math.random().toString()).toString('hex')
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ...bioData, secret }))
})

app.listen(port, function () {
    console.log(`App is listening on port http://localhost:${port} !`)
})