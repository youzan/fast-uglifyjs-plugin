var fs = require('fs');
var toString = Object.prototype.toString;

function UglifyCache(cacheFolder) {
    this.cacheFolder = cacheFolder;
    this.caches = [];
}

UglifyCache.prototype.createCacheFolder = function () {
    if (!fs.existsSync(this.cacheFolder)) {
        var mode = parseInt('0777', 8) & (~process.umask());
        fs.mkdirSync(this.cacheFolder, mode);
    }
    this.caches = fs.readdirSync(this.cacheFolder);
}

UglifyCache.prototype.isContainCache = function(fileName) {
    return this.caches.indexOf(fileName) > -1;
}

UglifyCache.prototype.isContainCacheMap = function(fileName) {
    return this.caches.indexOf(fileName + '.map') > -1;
}

UglifyCache.prototype.getCacheContent = function(fileName) {
    return fs.readFileSync(this.cacheFolder + '/' + fileName).toString();
}

UglifyCache.prototype.getCacheContentMap = function(fileName) {
    return fs.readFileSync(this.cacheFolder + '/' + fileName + '.map').toString();
}

UglifyCache.prototype.setCacheContent = function(filenameHash, fileHash, fileName, content) {
    // 删除前一次缓存
    var self = this;
    var fileNameRE = new RegExp(filenameHash + ".[A-z0-9]");
    var fileRE = new RegExp(filenameHash + '.' + fileHash + '(.map)?');
    var sourceFileNames = [];
    self.caches.forEach(function (cache) {
        // 文件名缓存相同，文件内容缓存不同，才执行删除
        if (fileNameRE.test(cache) && !fileRE.test(cache)) {
            sourceFileNames.push(cache);
        }
    });
    sourceFileNames.forEach(function(sourceFileName) {
        fs.unlinkSync(self.cacheFolder + '/' + sourceFileName);
    });
    fs.writeFileSync(self.cacheFolder + '/' + fileName, content);
}

module.exports = UglifyCache;