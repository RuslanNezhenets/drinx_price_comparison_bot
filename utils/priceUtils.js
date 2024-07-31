function comparePrices(data1, data2) {
    const result = []

    const data2Map = new Map()
    data2.forEach(item => data2Map.set(`${item.sku}-${item.size}`, item))

    data1.forEach(item1 => {
        const item2 = data2Map.get(`${item1.sku}-${item1.size}`)
        if (item2) {
            const {price: oldPrice, ...rest} = item1
            result.push({
                sku: item1.sku,
                title: item1.title,
                oldPrice: item1.price,
                newPrice: item2.price,
                size: item1.size,
            })
        }
    })

    return result
}

function updatePriceDifferences(priceDifferences, priceCheck, retailList) {
    return priceDifferences.map(item => {
        const matchingItemInPriceCheck = priceCheck.find(row => row['Lax'].toString() === item.sku.toString())
        const matchingItemRetailList = retailList.find(row => row['no'].toString() === matchingItemInPriceCheck['No.'].toString())
        if (matchingItemInPriceCheck && matchingItemRetailList) {
            return {
                ...item,
                sku: matchingItemInPriceCheck['No.'],
                title: matchingItemInPriceCheck['Item name'],
                price: matchingItemRetailList['unitPrice']
            }
        }
        return item
    })
}

module.exports = {
    comparePrices,
    updatePriceDifferences
}
