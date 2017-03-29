/*
 基于webpack.optimize.UglifyJsPlugin修改,增加了多进程和cache支持
 */
var os = require('os');
var fork = require('child_process').fork;
var path = require('path');
var SourceMapSource;
try {
    SourceMapSource = require("webpack-core/lib/SourceMapSource");
} catch (e) {
    SourceMapSource = require("webpack-sources").SourceMapSource;
}
var RawSource;
try {
    RawSource = require("webpack-core/lib/RawSource");
} catch (e) {
    RawSource = require("webpack-sources").RawSource;
}
var ModuleFilenameHelpers;
try {
    ModuleFilenameHelpers = require("webpack/lib/ModuleFilenameHelpers");
} catch (e) {
    ModuleFilenameHelpers = require("../ModuleFilenameHelpers");
}
var uglify = require("uglify-js");
var chalk = require('chalk');
var genHash = require('./genHash');
var UglifyCache = require('./UglifyCache');

var CACHE_FOLDER = './.uglify';

function FastUglifyJsPlugin(options) {
    if (typeof options !== "object") options = {};
    if (typeof options.compressor !== "undefined") {
        options.compress = options.compressor;
    }
    this.options = options;
}
module.exports = FastUglifyJsPlugin;

FastUglifyJsPlugin.prototype.apply = function (compiler) {
    var options = this.options;
    options.test = options.test || /\.js($|\?)/i;

    compiler.plugin("compilation", function (compilation) {
        if (options.sourceMap !== false) {
            compilation.plugin("build-module", function (module) {
                // to get detailed location info about errors
                module.useSourceMap = true;
            });
        }
        compilation.plugin("optimize-chunk-assets", function (chunks, callback) {
            var files = [];
            var tasks = [];
            var idleWorkers = [];   
            var busyWorkers = [];
            var warnings = [];
            var cbs = {};
            var completeNum = 0;
            var totalNum = 0;
            var cacheFolder = options.cacheFolder || CACHE_FOLDER;
            var isCache = !(options.cache === false);
            var uglifyCache = new UglifyCache(cacheFolder);
            if (isCache) {
                uglifyCache.createCacheFolder();
            }
            var unChangedChunks = [], changedChunks = [];
            chunks.forEach(function (chunk) {
                chunk.files.forEach(function (file) {
                    files.push(file);
                });
            });
            compilation.additionalChunkAssets.forEach(function (file) {
                files.push(file);
            });
            files = files.filter(ModuleFilenameHelpers.matchObject.bind(undefined, options));
            files.forEach(function (file) {
                var asset = compilation.assets[file];
                var input = asset.source();
                var fileHash = genHash(input);
                var filenameHash = genHash(file.replace(compilation.hash, '').slice(0, -3));
                var curFile = filenameHash + '.' + fileHash + '.js';
                var inputSourceMap;
                if (isCache) {
                    if(uglifyCache.isContainCache(curFile)) {
                        var cachedContent = uglifyCache.getCacheContent(curFile);
                        compilation.assets[file] = new RawSource(cachedContent);
                        // 记录未变化chunk
                        unChangedChunks.push(file);
                        return;
                    }
                    // 记录变化chunks
                    changedChunks.push(file);
                }
                if (asset.__UglifyJsPlugin) {
                    compilation.assets[file] = asset.__UglifyJsPlugin;
                    return;
                }
                if (options.sourceMap) {
                    if (asset.sourceAndMap) {
                        sourceAndMap = asset.sourceAndMap();
                        inputSourceMap = sourceAndMap.map;
                        input = sourceAndMap.source;
                    } else {
                        inputSourceMap = asset.map();
                        input = asset.source();
                    }
                } else {
                    input = asset.source();
                }
                tasks.push({
                    file: file,
                    input: input,
                    sourceMap: inputSourceMap,
                    options: options
                });
            });
            if (tasks.length) {
                var workerNum = options.workerNum || os.cpus().length;
                totalNum = tasks.length;
                while (workerNum > 0) {
                    workerNum--;
                    var worker = fork(path.join(__dirname, 'worker.js'));
                    idleWorkers.push(worker);
                    //主进程收到子进程的信息
                    worker.on('message', function (m) {
                        if (m.cmd === 'complete') {
                            var result = m.result;
                            var file = result.file;
                            var task = cbs[file];
                            var asset = compilation.assets[file];
                            asset.__UglifyJsPlugin = compilation.assets[file] = (result.map ?
                                new SourceMapSource(result.stream, file, JSON.parse(result.map), task.input, task.inputSourceMap) :
                                new RawSource(result.stream));
                            if (isCache) {
                                // 记录cache
                                var filenameHash = genHash(file.replace(compilation.hash, '').slice(0, -3));
                                var fileHash = genHash(task.input);
                                var name = filenameHash + '.' + fileHash + '.js';
                                uglifyCache.setCacheContent(filenameHash, name, asset.__UglifyJsPlugin._value);
                            }
                            completeNum++;
                            var arr = busyWorkers.filter(function (worker) {
                                return worker.pid == result.pid;
                            });
                            // move worker from busy to idle
                            if (arr.length) {
                                var index = busyWorkers.indexOf(arr[0]);
                                busyWorkers.splice(index, 1);
                                idleWorkers.push(arr[0]);
                            }
                            // all complete and callback
                            if (completeNum === totalNum) {
                                if (isCache) {
                                    log('\nchangedChunks: ' + chalk.red.bold(changedChunks.length) + '\n' + chalk.green(changedChunks.join('\n')));
                                    log('\nunChangedChunks: '+ chalk.red.bold(unChangedChunks.length) + '\n' + chalk.green(unChangedChunks.join('\n')));
                                }
                                if (warnings.length > 0) {
                                    compilation.warnings.push(new Error(file + " from UglifyJs\n" + warnings.join("\n")));
                                }
                                killWorkers();
                                callback();
                            } else {
                                startNext();
                            }

                        } else if (m.cmd === 'warning') {
                            warnings.push(m.msg);
                        } else if (m.cmd === 'error') {
                            var err = m.err || {};
                            if (err.msg) {
                                compilation.errors.push(new Error(m.file + " from UglifyJs\n" + err.msg));
                            } else {
                                compilation.errors.push(new Error(m.file + " from UglifyJs\n" + err.stack));
                            }
                            killWorkers();
                            callback();
                        }
                    });
                }
                process.on('exit', killWorkers);
                startNext();
            } else {
                if (isCache && unChangedChunks.length) {
                    log('\nunChangedChunks: '+ chalk.red.bold(unChangedChunks.length) + '\n' + chalk.green(unChangedChunks.join('\n')));
                }
                callback();
            }

            function killWorkers() {
                idleWorkers.concat(busyWorkers).forEach(function (worker) {
                    worker.kill();
                });
            }

            function startNext() {
                if (tasks.length && idleWorkers.length) {
                    do {
                        var task = tasks.shift();
                        var worker = idleWorkers.shift();
                        worker.send({cmd: 'uglify', task: task, time: Date.now()});
                        cbs[task.file] = task;
                        busyWorkers.push(worker);
                    } while (tasks.length && idleWorkers.length);
                }
            }

            function log(logInfo) {
                if (options.debug) {
                    console.log(logInfo);
                }
            };
        });
        compilation.plugin("normal-module-loader", function (context) {
            context.minimize = true;
        });
    });
};