[gulp](http://gulpjs.com/)是一个基于流的自动化构建工具，简单、易用、高效。目前，我几乎所有的web项目都离不开它，实在是太好用了！下面我将分享我的一些心得。

## 复制文件
gulp的插件很多，但是如果你搜索复制文件的插件，会发现好少，因为其实根本没必要，gulp本身就能复制文件。例如下面的例子，将`test.md`从目录`./a/`复制到目录`./b/`：
```js
gulp.src('./a/test.md').pipe(gulp.dest('./b/'));
```
是不是很简单？唯一要做的，就是过滤一下，配置要复制的文件。比如复制这个目录下的图片：
```js
gulp.src('./src/**/*.{jpg,png,gif}').pipe(gulp.dest('./img/'));
```

## 使用gulp-load-plugins
如果用每一个插件之前都要写一遍`var somePlugin = require('somePlugin')`，是不是很麻烦？可以使用[gulp-load-plugins](https://www.npmjs.com/package/gulp-load-plugins)轻松解决。
```js
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();

gulp.task('markdown', function() {
    return gulp.src(['./src/articles/**/*.md'])
        .pipe(markdown())
        .pipe(plugins.rename({
            extname: '.html'
        }))
        .pipe(gulp.dest('./html-articles/'));
});
```
相当于：
```js
var gulp = require('gulp');
var rename = require('gulp-rename');

gulp.task('markdown', function() {
    return gulp.src(['./src/articles/**/*.md'])
        .pipe(markdown())
        .pipe(rename({
            extname: '.html'
        }))
        .pipe(gulp.dest('./html-articles/'));
});
```

## 顺序执行任务
如果希望顺序执行一系列任务，那么可以使用[runSequence](https://www.npmjs.com/package/run-sequence)：
```js
var gulp = require('gulp');
var runSequence = require('run-sequence');

gulp.task('build', function(callback) {
    // 将顺序执行这几个任务
    runSequence('less', 'markdown', 'jade', 'copy', callback);
});
```

## 自定义任务
有需要的时候，不一定是要使用插件，也可以根据需要自己定义任务：
```js
gulp.task('customTask', function(callback) {
    doSomething(function(err) {
        if (err) callback(err);
        else callback();
    });
});
```

## 使用through2编写插件
当现有的插件无法满足需求的时候，不必再继续寻找，自己写一个也非常简单。  
例如：
```js
var through = require('through2');
module.exports = function() {
    return through.obj(function(file, encoding, callback) {
        // 判断类型，使用buffer处理
        if (file.isBuffer()) {
            // 读取文件内容
            markdownToHtml(file.contents.toString())
            .then(function(html) {
                file.contents = Buffer(html, encoding); // 保存修改
                callback(null, file); // 完成处理
            })
            .catch(function(err) {
                console.error(err.stack || err);
                callback(null, file); // 这里可以根据需要是否做
            });
        }
        else {
            callback(null, file);
        }
    });
};
```
这个插件的功能是将markdown文件通过自己编写的markdownToHtml函数转换成html，并不是公开发布，只为了满足特定的需求，所以写得比较随意，一个好的插件的代码应该是这样的：[示例](https://github.com/gulpjs/gulp/blob/master/docs/writing-a-plugin/guidelines.md#what-does-a-good-plugin-look-like)。

当有特定需求时，不妨写个简单的插件，只需要关心文件的输入输出，写好处理过程即可，其它的交给gulp，非常方便地批量处理一些文件，并且还可以和其它插件或任务组合实现更复杂的功能。
