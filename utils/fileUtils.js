const fs = require('fs');

module.exports = {
    readData: (filePath) => JSON.parse(fs.readFileSync(filePath)),
    writeData: (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data))
};