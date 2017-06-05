var uglify = require("uglify-js");
var SourceMapConsumer;
try {
    SourceMapConsumer = require("webpack-core/lib/source-map").SourceMapConsumer;
} catch (e) {
    SourceMapConsumer = require("source-map").SourceMapConsumer;
}

process.on('message', function (m) {
    if (m.cmd == 'uglify') {
        try {
            doUglify(m.task);
        } catch (e) {
            process.send({
                cmd: 'error',
                err: {
                    name: e.name,
                    message: e.message,
                    stack: e.stack
                },
                file: m.task.file
            });
        }
    }
});

function doUglify(task) {
    var oldWarnFunction = uglify.AST_Node.warn_function;
    var options = task.options;
    if (options.sourceMap) {
        var sourceMap = new SourceMapConsumer(task.inputSourceMap);
        uglify.AST_Node.warn_function = function (warning) { // eslint-disable-line camelcase
            var match = /\[.+:([0-9]+),([0-9]+)\]/.exec(warning);
            var line = +match[1];
            var column = +match[2];
            var original = sourceMap.originalPositionFor({
                line: line,
                column: column
            });
            if (!original || !original.source || original.source === task.file) return;
            process.send({
                cmd: 'warning',
                msg: warning.replace(/\[.+:([0-9]+),([0-9]+)\]/, "") +
                "[" + original.source + ":" + original.line + "," + original.column + "]"
            });
        };
    } else {
        uglify.AST_Node.warn_function = function (warning) { // eslint-disable-line camelcase
            process.send({
                cmd: 'warning', msg: warning
            });
        };
    }
    uglify.base54.reset();
    var ast = uglify.parse(task.input, {
        filename: task.file
    });
    if (options.compress !== false) {
        ast.figure_out_scope();
        var compress = uglify.Compressor(options.compress); // eslint-disable-line new-cap
        ast = ast.transform(compress);
    }
    if (options.mangle !== false) {
        ast.figure_out_scope();
        ast.compute_char_frequency(options.mangle || {});
        ast.mangle_names(options.mangle || {});
        if (options.mangle && options.mangle.props) {
            uglify.mangle_properties(ast, options.mangle.props);
        }
    }
    var output = {};
    output.comments = Object.prototype.hasOwnProperty.call(options, "comments") ? options.comments : /^\**!|@preserve|@license/;
    output.beautify = options.beautify;
    for (var k in options.output) {
        output[k] = options.output[k];
    }
    if (options.sourceMap !== false) {
        var map = uglify.SourceMap({ // eslint-disable-line new-cap
            file: task.file,
            root: ""
        });
        output.source_map = map; // eslint-disable-line camelcase
    }
    var stream = uglify.OutputStream(output); // eslint-disable-line new-cap
    ast.print(stream);
    if (map) map = map + "";
    stream = stream + "";
    uglify.AST_Node.warn_function = oldWarnFunction;
    process.send({
        cmd: 'complete',
        result: {map: map, stream: stream, file: task.file, pid: process.pid},
        time: Date.now()
    })
}