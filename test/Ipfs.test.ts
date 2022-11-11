import test, {describe, it} from "node:test";
import assert from "assert";
import {hlaEncodingKey, uploadGenomeToIpfs} from "../src/app";
import {Encryptor} from "../src/encryptor";

(async () => {
        const cid = await uploadGenomeToIpfs('test')
        // const cid = 'bafybeihfkmtsraiwkdkb7pc7ltmmsiqawoozzbjtcanilbykpv6trj5m7y'

        const url = `https://${cid}.ipfs.w3s.link/ipfs/${cid}/file`

        const response = await fetch(url)
        const encoded = await response.arrayBuffer()

        const encryptor = new Encryptor(hlaEncodingKey)
        const decoded = encryptor.decrypt(new Uint8Array(encoded))

        assert.equal(decoded, "test")
})()