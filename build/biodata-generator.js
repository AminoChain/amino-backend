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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
const fs = __importStar(require("fs"));
function generate() {
    const alleleList = fs.readFileSync('src/Allelelist.3200.txt', 'utf-8');
    // const neededTypes = new RegExp(/^(A|B|C|DRB\d|DPB\d)$/)
    const data = alleleList.split(/\r?\n/)
        .filter(line => line && !line.startsWith('#')) // skip comments
        .filter((line, index) => index != 0) // skip header
        .map(line => {
        const regexp = new RegExp(/HLA\d+,(A|B|C|DRB|DPB)(\d?\*.+)/g, "g");
        const match = regexp.exec(line);
        if (match && match[1] && match[2]) {
            return {
                type: match[1],
                value: match[2]
            };
            // throw Error(`Cannot parse ${line}`)
        }
        else {
            return null;
        }
    })
        .filter(item => !!item);
    /*.filter( ({ type }) => {
        return neededTypes.test(type)
    } )*/
    const groupedByType = data.reduce((collector, item) => {
        collector[item.type] = collector[item.type] || [];
        collector[item.type].push(item);
        return collector;
    }, Object.create(null));
    const result = {};
    for (let type in groupedByType) {
        const items = groupedByType[type];
        const randomIndex = Math.floor(Math.random() * items.length);
        result[type] = items.map(item => `HLA ${type}${item.value}`)[randomIndex];
    }
    // console.log(result)
    // console.log(groupedByType)
    return result;
    // const randomElement = Math.floor(Math.random() * data.length)
    // return data.map(({ type, value }) => `HLA ${type}*${value}`)[randomElement]
}
exports.generate = generate;
