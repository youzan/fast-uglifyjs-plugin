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

UglifyCache.prototype.setCacheContent = function(sourceName, fileName, content) {
    // 删除前缓存
    var re = new RegExp(sourceName + ".[A-z0-9]+.js", "g");
    var sourceFileName;
    var flag = this.caches.some(function (cache) {
        var test = re.test(cache);
        if (test) {
            sourceFileName = cache;
        }
        return test;
    });
    if (flag) {
        fs.unlinkSync(this.cacheFolder + '/' + sourceFileName);
    }
    fs.writeFileSync(this.cacheFolder + '/' + fileName, content);
}

module.exports = UglifyCache;