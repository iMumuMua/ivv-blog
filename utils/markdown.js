var path = require('path');
var marked = require('marked'),
    hljs = require('highlight.js'),
    jsdom = require('jsdom'),
    through = require('through2');

/**
 * 将markdown转换为html
 * @param  {String}   markdownContent markdown内容
 * @param  {Boolean}  safe 是否使用安全模式
 * @return {Promise}
 */
var markdownToHtml = function(markdownContent, safe) {
    var df = Promise.defer();

    marked.setOptions({
        highlight: function (code) {
            return hljs.highlightAuto(code).value;
        },
        sanitize: safe
    });

    var html = marked(markdownContent);
    jsdom.env({
        html: '<div id="marked">' + html + '</div>',
        scripts: [path.join(__dirname, './jquery.js')],
        done: function (err, window) {
            if (err) {
                df.reject(err);
                return;
            }

            var $ = window.$;
            $('pre').addClass('hljs');
            $('img').addClass('img-responsive');
            $('a').attr('target', '_blank');
            $('a[href^=#]').removeAttr('target');
            df.resolve($('#marked').html());
        }
    });
    return df.promise;
};

module.exports = function() {
    return through.obj(function(file, encoding, callback) {
        if (file.isBuffer()) {
            markdownToHtml(file.contents.toString())
            .then(function(html) {
                file.contents = Buffer(html, encoding)
                callback(null, file);
            })
            .catch(function(err) {
                console.error(err.stack || err);
                callback(null, file);
            });
        }
        else {
            callback(null, file);
        }
    });
};
