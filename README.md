## 简介
FastUglifyJsPlugin基于webpack.optimize.UglifyJsPlugin修改，增加了多进程的支持。用法和webpack.optimize.UglifyJsPlugin完全一样。

生产环境的构建，uglify过程占了70%左右的时间。多进程可以提高uglify对cpu的利用，缩短构建时间。

## 安装

```
	ynpm i @youzan/fast-uglifyjs-plugin --save
```

## 示例

```

var FastUglifyJsPlugin = require('@youzan/fast-uglifyjs-plugin');

module.exports = {
    entry: {...},
    output: {...},
    plugins: [new FastUglifyJsPlugin({
        compress: {
            warnings: false
        }
        // 默认开启缓存，提高uglify效率，关闭请使用:
        // cache: false,
        // 默认缓存路径为项目根目录，手动配置请使用:
        // cacheFolder: path.resolve(__dirname, './.otherFolder/')
    })]
};
```