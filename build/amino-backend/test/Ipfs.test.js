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
const node_test_1 = require("node:test");
const assert_1 = __importDefault(require("assert"));
const app_1 = require("../src/app");
const encryptor_1 = require("../src/encryptor");
(0, node_test_1.describe)('', () => {
    (0, node_test_1.it)('', () => __awaiter(void 0, void 0, void 0, function* () {
        const cid = yield (0, app_1.uploadGenomeToIpfs)('test');
        // const cid = 'bafybeihfkmtsraiwkdkb7pc7ltmmsiqawoozzbjtcanilbykpv6trj5m7y'
        const url = `https://${cid}.ipfs.w3s.link/ipfs/${cid}/file`;
        const response = yield fetch(url);
        const encoded = yield response.arrayBuffer();
        const encryptor = new encryptor_1.Encryptor(app_1.hlaEncodingKey);
        const decoded = encryptor.decrypt(new Uint8Array(encoded));
        assert_1.default.equal(decoded, "test");
    }));
});
