const ExcelJS = require('exceljs')
const {extractDate} = require('./dataUtils')

function insertTable(worksheet, headers, data) {
    const table = worksheet.addTable({
        name: worksheet.name.replaceAll(' ', '_'),
        ref: 'A1',
        headerRow: true,
        totalsRow: false,
        style: {
            theme: 'TableStyleMedium2',
            showRowStripes: true,
        },
        columns: headers.map(header => ({name: header.header, filterButton: true})),
        rows: data.map(row => headers.map(header => row[header.key]))
    })

    table.commit()
}

function addConditionalFormatting(worksheet, columnLetter, rowCount) {
    worksheet.addConditionalFormatting({
        ref: `${columnLetter}2:${columnLetter}${rowCount}`,
        rules: [
            {
                type: 'expression',
                formulae: [`${columnLetter}2>0`],
                style: {font: {color: {argb: '0fbf4a'}}}
            },
            {
                type: 'expression',
                formulae: [`${columnLetter}2<0`],
                style: {font: {color: {argb: 'FFFF0000'}}}
            }
        ]
    })
}

function autoFitColumns(worksheet) {
    worksheet.columns.forEach(column => {
        let maxLength = 0
        column.eachCell({includeEmpty: true}, cell => {
            const cellLength = cell.value ? cell.value.toString().length : 10
            if (cellLength > maxLength) {
                maxLength = cellLength
            }
        })
        column.width = maxLength + 5
    })
}

async function writeJsonToExcel(jsonData, notPresentInSku, filePath1, filePath2) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Price Differences')

    worksheet.columns = [
        {header: 'SKU', key: 'sku'},
        {header: 'Title', key: 'title'},
        {header: 'Size', key: 'size'},
        {header: 'Price', key: 'price'},
        {header: `Price ${extractDate(filePath1)}`, key: 'oldPrice'},
        {header: `Price ${extractDate(filePath2)}`, key: 'newPrice'},
        {header: 'Price Difference (%)', key: 'priceDifference'}
    ]

    insertTable(worksheet, worksheet.columns, jsonData)

    const oldPriceColumnLetter = worksheet.getColumn('oldPrice').letter
    const newPriceColumnLetter = worksheet.getColumn('newPrice').letter

    for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i)

        const priceDifferenceCell = row.getCell('priceDifference')
        const oldPriceCellRef = `${oldPriceColumnLetter}${i}`
        const newPriceCellRef = `${newPriceColumnLetter}${i}`

        const priceDifferenceFormula = `=ROUND((${newPriceCellRef} - ${oldPriceCellRef}) / ${oldPriceCellRef} * 100, 2)`
        priceDifferenceCell.value = {formula: priceDifferenceFormula}
    }

    addConditionalFormatting(worksheet, 'G', worksheet.rowCount)
    autoFitColumns(worksheet)

    const notPresentWorksheet = workbook.addWorksheet('Missing items')

    const headersNotPresent = Object.keys(notPresentInSku[0] || {}).map(key => ({header: key, key}))
    notPresentWorksheet.columns = headersNotPresent

    insertTable(notPresentWorksheet, headersNotPresent, notPresentInSku)
    autoFitColumns(notPresentWorksheet)

    return workbook
}

module.exports = {
    writeJsonToExcel
}
