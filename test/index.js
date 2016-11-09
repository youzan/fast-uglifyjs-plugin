var path = require('path');
var vm = require('vm');
var webpack = require('webpack');
var assert = require('chai').assert;
var fs = require('fs');
var config = require('./webpack.config.js');

describe('FastUglifyJsPlugin', function () {
    it('should build', function (done) {
        webpack(config, function (err) {
            assert.isNull(err);
            done();
        });
    });
    it('should create a output file', function () {
        var stats = fs.statSync(path.join(__dirname, 'outs/factorial.js'));
        assert.isTrue(stats.isFile());
    });
    it('should correctly run', function () {
        var factorial = require('./cases/factorial');
        var code = fs.readFileSync(path.join(__dirname, 'outs/factorial.js')).toString();
        vm.runInThisContext(code);
        assert.strictEqual(factorial(18), global.factorial(18));
    });
});