import * as fs from 'fs'

interface Item {
    type: 'A'|'B'|'C'|'DRB'|'DPB'
    value: string
}

export function generate() {
    const alleleList = fs.readFileSync('src/Allelelist.3200.txt', 'utf-8')
    // const neededTypes = new RegExp(/^(A|B|C|DRB\d|DPB\d)$/)

    const data = alleleList.split(/\r?\n/)
        .filter( line => line && !line.startsWith('#')) // skip comments
        .filter( (line, index) => index != 0) // skip header
        .map( line => {
            const regexp = new RegExp(/HLA\d+,(A|B|C|DRB|DPB)(\d?\*.+)/g, "g")
            const match = regexp.exec(line)
            if (match && match[1] && match[2]) {
                return {
                    type: match[1],
                    value: match[2]
                }
                // throw Error(`Cannot parse ${line}`)
            } else {
                return null
            }
        })
        .filter( item => !!item ) as Item[]
        /*.filter( ({ type }) => {
            return neededTypes.test(type)
        } )*/

    const groupedByType = data.reduce( (collector, item) => {
        collector[item.type] = collector[item.type] || [];
        collector[item.type].push(item);
        return collector;
    }, Object.create(null));

    const result: any = {}

    for( let type in groupedByType) {
        const items = groupedByType[type] as any[]
        const randomIndex = Math.floor(Math.random() * items.length)
        result[type] = items.map( item => `HLA ${type}${item.value}`)[randomIndex]
    }
    // console.log(result)
    // console.log(groupedByType)
    return result

    // const randomElement = Math.floor(Math.random() * data.length)
    // return data.map(({ type, value }) => `HLA ${type}*${value}`)[randomElement]
}