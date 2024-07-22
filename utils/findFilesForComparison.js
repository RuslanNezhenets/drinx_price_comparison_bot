const fs = require('fs')
const path = require('path')
const {parse, differenceInDays, subDays} = require('date-fns')

// Путь к папке с файлами
const directoryPath = path.join(__dirname, '../Data')

// Функция для получения названий файлов
const getFiles = async (dirPath) => {
    try {
        return await fs.promises.readdir(dirPath)
    } catch (error) {
        console.error('Error reading directory:', error)
        return []
    }
}

// Функция для извлечения даты из названия файла
const extractDateFromFileName = (fileName) => {
    const match = fileName.match(/\d{2}\.\d{2}\.\d{4}/)
    return match ? parse(match[0], 'MM.dd.yyyy', new Date()) : null
}

// Функция для нахождения файла с датой, ближайшей к целевой дате
const findClosestFile = (files, targetDate) => {
    return files.reduce((closest, file) => {
        const fileDate = extractDateFromFileName(file)
        if (fileDate && (!closest.file || Math.abs(differenceInDays(fileDate, targetDate)) < Math.abs(differenceInDays(closest.date, targetDate)))) {
            return {file, date: fileDate}
        }
        return closest
    }, {file: null, date: null})
}

// Вызов функций для получения и нахождения файлов
const getFilesForComparison = async () => {
    const files = await getFiles(directoryPath)
    const today = new Date()
    const closestFile = findClosestFile(files, today)
    const weekOldFile = findClosestFile(files, subDays(closestFile.date, 7))

    return {closestFile: closestFile.file, weekOldFile: weekOldFile.file}
}

module.exports = {getFilesForComparison}
