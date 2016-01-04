var fs = require('fs');
var path = require('path');

var jade = require('jade');
var through = require('through2');

// article data
var articles = require('../src/data/articles');

var projectDir = path.join(__dirname, '..');

exports.renderIndex = function(callback) {
    fs.readFile(path.join(projectDir, 'src/templates/index.jade'), 'utf8', function(err, data) {
        if (err) callback(err);
        else onReadIndexJadeSuccess(data);
    });

    function onReadIndexJadeSuccess(data) {
        var fn = jade.compile(data, {
            basedir: projectDir,
            pretty: '    '
        });
        var html = fn({articles: articles});
        fs.writeFile(path.join(projectDir, 'www/index.html'), html, {
            encoding: 'utf8',
            mode: 0o644
        }, callback);
    }
};

// 输入是从markdown转换成html的片段
exports.renderArticles = function() {
    var articleJade = fs.readFileSync(path.join(projectDir, 'src/templates/article.jade'), 'utf8');
    var compiler = jade.compile(articleJade, {
        basedir: projectDir,
        pretty: '    '
    });

    return through.obj(function(file, encoding, callback) {
        if (file.isBuffer()) {
            var markdownHtmlContent = file.contents.toString();
            var title = path.basename(file.relative, '.html');
            var html = compiler({
                title: title,
                content: markdownHtmlContent
            });
            file.contents = Buffer(html, encoding);
            callback(null, file);
        }
        else {
            callback(null, file);
        }
    });
}