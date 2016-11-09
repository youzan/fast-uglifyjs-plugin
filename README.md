## 简介
FastUglifyJsPlugin基于webpack.optimize.UglifyJsPlugin修改，增加了多进程的支持。用法和webpack.optimize.UglifyJsPlugin完全一样。

生产环境的构建，uglify过程占了70%左右的时间。多进程可以提高uglify对cpu的利用，缩短构建时间。

## 安装

```
	ynpm i @youzan/fast-uglifyjs-plugin --save
```

## 式例

```
var path = require("path");
var FastUglifyJsPlugin = require('@youzan/fast-uglifyjs-plugin');

module.exports = {
    entry: {...},
    output: {...},
    plugins: [new FastUglifyJsPlugin({
        compress: {
            warnings: false
        }
    })]
};
```