const {convertFirstSheetToJson, normalizeId, extractDate, determineReason, getRetail} = require('./utils/dataUtils')
const {writeJsonToExcel} = require('./utils/excelUtils')
const {comparePrices, updatePriceDifferences} = require('./utils/priceUtils')
const {getFilesForComparison} = require("./utils/findFilesForComparison")

require('dotenv').config()

const priceCheckFilePath = process.env.PRICE_CHECK_FILE_PATH
const parsingDataPath = process.env.PARSING_DATA_PATH

async function main() {
    const filesForComparison = await getFilesForComparison()

    const oldFilePath = parsingDataPath + '/' + filesForComparison.weekOldFile
    const newFilePath = parsingDataPath + '/' + filesForComparison.closestFile

    const jsonData1 = convertFirstSheetToJson(oldFilePath)
    const jsonData2 = convertFirstSheetToJson(newFilePath)
    const priceCheck = convertFirstSheetToJson(priceCheckFilePath).filter(row => 'Lax' in row)

    let priceDifferences = comparePrices(jsonData1, jsonData2)

    let skuSet = new Set(priceDifferences.map(item => normalizeId(item.sku.toString())))
    let presentInSku = priceCheck.filter(item => skuSet.has(normalizeId(item['Lax'].toString())))
    let notPresentInSku = priceCheck
        .filter(item => !skuSet.has(normalizeId(item['Lax'].toString())))
        .map(item => ({
            ...item,
            'Reason': determineReason(item, jsonData1, jsonData2, oldFilePath, newFilePath)
        }))

    priceDifferences = priceDifferences
        .filter(row => presentInSku.map(row => row['Lax']).find(sku => sku.toString() === row.sku.toString()))
        .filter(row => row.oldPrice !== row.newPrice)

    const retailList = await getRetail()

    priceDifferences = updatePriceDifferences(priceDifferences, priceCheck, retailList)

    const workbook = await writeJsonToExcel(priceDifferences, notPresentInSku, oldFilePath, newFilePath)

    //const outputFilePath = 'Price_Differences.xlsx'
    //await workbook.xlsx.writeFile(outputFilePath)

    return {file: workbook, oldDate: extractDate(oldFilePath, '.'), newDate: extractDate(newFilePath, '.')}
}

module.exports = {main}
