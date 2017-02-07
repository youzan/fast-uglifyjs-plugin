## 简介
生产环境的构建，uglify过程占了70%左右的时间，是一个非常耗时的过程。相对于webpack原生UglifyJsPlugin，FastUglifyJsPlugin增加了多进程和缓存。多进程可以最大限度的利用多核cpu的计算能力，缓存可以按需编译，减少不必要的计算。以下是一组性能测试数据，FastUglifyJsPlugin的性能提升非常明显。

|插件|耗时|
|------|---------|
|webpack.optimize.UglifyJsPlugin|7.4 min|
|FastUglifyJsPlugin without cache|4.45 min|
|FastUglifyJsPlugin with cache|36 s|

测试样本：29 entry,1924 modules

测试环境：MacBook Pro，4核cpu,8g内存


## 安装

```shell
ynpm i @youzan/fast-uglifyjs-plugin --save
```

## 配置
FastUglifyJsPlugin基于webpack.optimize.UglifyJsPlugin修改，用法和webpack.optimize.UglifyJsPlugin完全一样，只是增加了几个额外的配置参数。

```js
var FastUglifyJsPlugin = require('@youzan/fast-uglifyjs-plugin');

module.exports = {
    entry: {...},
    output: {...},
    plugins: [new FastUglifyJsPlugin({
        compress: {
            warnings: false
        },
        // debug设为true可输出详细缓存使用信息:
        // debug: true
        // 默认开启缓存，提高uglify效率，关闭请使用:
        // cache: false,
        // 默认缓存路径为项目根目录，手动配置请使用:
        // cacheFolder: path.resolve(__dirname, '.otherFolder')
    })]
};
```