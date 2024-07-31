const XLSX = require("xlsx")
const axios = require("axios")

require('dotenv').config()

async function getRetail() {
    const url = process.env.URL_DYNAMICS_API
    const username = process.env.USERNAME_DYNAMICS_API
    const password = process.env.PASSWORD_DYNAMICS_API

    const basicAuth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64')

    let response = []
    try {
        response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': basicAuth
            }
        })
    } catch (e) {
        console.log(e.message)
    }

    if (response.status === 200) {
        console.log('Данные с Dynamics успешно получены')
        return response.data.value
    } else {
        console.log('Request failed with status: ' + response.status)
        console.log('Не удалось актуализировать Retail список')
        const {localRetailList} = require("../retailList")
        return localRetailList
    }
}

function determineReason(item, jsonData1, jsonData2, filePath1, filePath2) {
    const normalizedId = normalizeId(item['Lax'].toString())
    const inJsonData1 = jsonData1.some(data1Item => normalizeId(data1Item.sku.toString()) === normalizedId)
    const inJsonData2 = jsonData2.some(data2Item => normalizeId(data2Item.sku.toString()) === normalizedId)

    const date1 = extractDate(filePath1)
    const date2 = extractDate(filePath2)

    if (inJsonData2 && !inJsonData1) {
        return `Present in ${date2}, missing in ${date1}`
    } else if (inJsonData1 && !inJsonData2) {
        return `Present in ${date1}, missing in ${date2}`
    } else if (!inJsonData1 && !inJsonData2) {
        return `Missing in both ${date1} and ${date2}`
    }

    return 'Other reason'
}

function convertFirstSheetToJson(filePath) {
    const workbook = XLSX.readFile(filePath)
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    return XLSX.utils.sheet_to_json(worksheet)
}

function extractDate(filePath, separator = '/') {
    const datePattern = /(\d{2})\.(\d{2})\.\d{4}/
    const match = filePath.match(datePattern)

    if (match) {
        const month = match[1]
        const day = match[2]
        return `${month}${separator}${day}`
    } else {
        return null
    }
}
function normalizeId(id) {
    return id.toString().replace(/^0+/, '')
}

function formatProductText(products) {
    return products.map(product => {
        const arrow = product.newPrice > product.oldPrice ? '🟢' : '🔴'
        return `#${product.sku} - ${product.title} - ${product.size} - ${arrow} - $${product.newPrice.toFixed(2)} - Lax`
    }).join('\n')
}

module.exports = {
    convertFirstSheetToJson,
    determineReason,
    extractDate,
    normalizeId,
    getRetail,
    formatProductText
}
