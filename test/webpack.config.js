var path = require("path");
var FastUglifyJsPlugin = require('../index.js');

module.exports = {
    entry: path.join(__dirname, 'cases/factorial.js'),
    output: {
        path: path.join(__dirname, 'outs'),
        filename: 'factorial.js'
    },
    devtool: 'eval',
    plugins: [
        new FastUglifyJsPlugin({
            compress: {
                warnings: false
            },
            debug: true,
            // cache: false,
            // cacheFolder: path.resolve(__dirname, './.otherFolder/')
        })
    ]
};
