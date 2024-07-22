import fetch from 'node-fetch'
import dotenv from 'dotenv'
import {main} from './app.js'
import {Blob} from 'buffer'

dotenv.config()

const token = process.env.BOT_TOKEN
const chatId = process.env.CHAT_ID.startsWith('-') ? process.env.CHAT_ID : `-${process.env.CHAT_ID}`

const sendMessage = async (token, chatId) => {
    try {
        const {file, oldDate, newDate} = await main()
        const workbookBuffer = await file.xlsx.writeBuffer()
        const workbookBlob = new Blob([workbookBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})

        const message = `Сравнение цен за ${oldDate} и за ${newDate}`

        const form = new FormData()
        form.append('chat_id', chatId)
        form.append('caption', message)
        form.append('document', workbookBlob, `PriceDifferences ${oldDate}-${newDate}.xlsx`)

        const url = `https://api.telegram.org/bot${token}/sendDocument`
        const response = await fetch(url, {method: 'POST', body: form})

        if (response.ok) {
            await response.json()
        } else {
            const errorResponse = await response.json()
            console.error('Error sending file and message:', errorResponse)
        }
    } catch (error) {
        console.error('An error occurred:', error)
    }
};

sendMessage(token, chatId).then()
