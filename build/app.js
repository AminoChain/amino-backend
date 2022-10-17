"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const keccak256_1 = __importDefault(require("keccak256"));
const biodata_generator_1 = require("./biodata-generator");
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.get('/bio-data', (req, res) => {
    const bioData = (0, biodata_generator_1.generate)();
    const secret = (0, keccak256_1.default)(Math.random()).toString('hex');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(Object.assign(Object.assign({}, bioData), { secret })));
});
app.listen(port, function () {
    console.log(`App is listening on port http://localhost:${port} !`);
});
