<p>
<a href="https://github.com/youzan/"><img alt="有赞logo" width="36px" src="https://img.yzcdn.cn/public_files/2017/02/09/e84aa8cbbf7852688c86218c1f3bbf17.png" alt="youzan"></a>
</p>
<p align="center">FastUglifyJsPlugin</p>

## Introduction
[中文文档](https://github.com/youzan/fast-uglifyjs-plugin/blob/master/README_ZH.md)

compatible with webpack 2

The uglify process of building project in production environment is very time consuming. It could take up to 70% of the build time. FastUglifyJsPlugin have multi-process and cache feature comparing to webpack's UglifyJsPlugin. Multi-process can utilize multicore cpu's caculation capability. Cache can minimize the need to complie code. Below is a set of performance testing data. FastUglifyJsPlugin has a way better performace.

|plugin|time|
|------|---------|
|webpack.optimize.UglifyJsPlugin|7.4 min|
|FastUglifyJsPlugin without cache|4.45 min|
|FastUglifyJsPlugin with cache|36 s|

test sample：29 entry,2615 modules

test environment：MacBook Pro，4 core cpu,8g memory


## Installation

```shell
npm i fast-uglifyjs-plugin --save

# or 

yarn add fast-uglifyjs-plugin
```

## Configuration
FastUglifyJsPlugin is base on webpack.optimize.UglifyJsPlugin. They have the same usage except for a few extra configuration.

```js
var FastUglifyJsPlugin = require('fast-uglifyjs-plugin');

module.exports = {
    entry: {...},
    output: {...},
    plugins: [new FastUglifyJsPlugin({
        compress: {
            warnings: false
        },
        // set debug as true to output detail cache information           
        debug: true,
        // enable cache by default to improve uglify performance. set false to turn it off
        cache: false,
        // root directory is the default cache path. it can be configured by following setting
        cacheFolder: path.resolve(__dirname, '.otherFolder'),
        // num of worker process default ,os.cpus().length
        workerNum: 2
    })]
};
```
### Licence
[MIT](https://zh.wikipedia.org/wiki/MIT%E8%A8%B1%E5%8F%AF%E8%AD%89)