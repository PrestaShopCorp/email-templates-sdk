var gulp = require('gulp');
var mjml = require('gulp-mjml')
var mjmlEngine = require('mjml')
var i18n = require('gulp-html-i18n')
var download = require("gulp-download-stream");
var buffer = require('vinyl-buffer')
var replace_task = require('gulp-replace-task');
var ext_replace = require('gulp-ext-replace');
var zip = require('gulp-zip');
var replace = require('gulp-replace');
var rename = require("gulp-rename");
var fs = require('fs');
var del = require('del');
var through = require('through2');
var migrate = require('mjml-migrate').default;
var htmlBeautify = require('js-beautify').html;

var settings = require('./src/config/settings.json');

// Compile files [dev mode]
gulp.task('build:dev', function () {
    var css = fs.readFileSync(__dirname+'/src/css/global.css', 'utf8');
    var fake_json_path = './src/config/fake.json';
    delete require.cache[require.resolve(fake_json_path)]
    var fake = require(fake_json_path);

    return gulp.src(['src/*.mjml'])

        // Compile MJML to HTML
        .pipe(mjml(mjmlEngine))

        // Delete conditions
        .pipe(replace('{{/if}}', ''))
        .pipe(replace(/{{if \$[a-z_]+}}/ig, ''))

        // We need to decode some curly brackets & dollar signs because of MJML
        .pipe(replace('%7B%7B', '{{'))
        .pipe(replace('%7D%7D', '}}'))
        .pipe(replace('&#36;', '$'))

        // CSS injection in the header
        .pipe(replace('</head>', '<style>'+css+'</style></head>'))

        // Translate
        .pipe(i18n({
            langDir: './langs',
            trace: true,
            createLangDirs: true
        }))

        // Replace variables with fake data
        .pipe(replace_task({
            patterns: [{json: fake}],
            usePrefix: false
        }))

        .pipe(gulp.dest('./dist/html/'))
});

// Compile files with MJML
gulp.task('build:mjml', function () {
    var css = fs.readFileSync(__dirname+'/src/css/global.css', 'utf8');

    return gulp.src(['src/*.mjml'])

        // Compile MJML to HTML
        .pipe(mjml(mjmlEngine))

        // We need to decode some curly brackets & dollar signs because of MJML
        .pipe(replace('%7B%7B', '{{'))
        .pipe(replace('%7D%7D', '}}'))
        .pipe(replace('&#36;', '$'))

        // CSS injection in the header
        .pipe(replace('</head>', '<style>'+css+'</style></head>'))

        // Rename files
        .pipe(ext_replace('.tpl'))

        .pipe(gulp.dest('./dist/'+settings.name))
});

// Copy images in dist folder
gulp.task('build:copy:img', function() {
    return gulp.src('src/img/*.{jpg,jpeg,png,gif}')
                    .pipe(gulp.dest('./dist/'+settings.name+'/img/'));
});

// Copy tpls in dist folder
gulp.task('build:copy:tpl', function () {
        return gulp.src('src/*.tpl')
            .pipe(gulp.dest('./dist/'+settings.name+'/tpl/'));
});

// Copy preview img in dist folder
gulp.task('build:copy:preview', function() {
    return gulp.src('src/preview.jpg')
                    .pipe(gulp.dest('./dist/'+settings.name+'/'));
});

// Copy settings in dist folder
gulp.task('build:copy:settings', function() {
    return gulp.src('src/config/settings.json')
                .pipe(gulp.dest('./dist/'+settings.name+'/'));
});

// Compress folder
gulp.task('build:compress', ['build:copy:settings', 'build:mjml', 'build:copy:tpl', 'build:copy:img', 'build:copy:preview'], function() {
    return gulp.src('./dist/'+settings.name+'/**/*')
                        .pipe(zip(settings.name+'.zip'))
                        .pipe(gulp.dest('./dist/'));
});

// Copy images in dist folder
gulp.task('build', ['build:copy:settings', 'build:mjml', 'build:copy:img', 'build:copy:preview', 'build:copy:tpl', 'build:compress']);

// Watch changes
gulp.task('watch', function () {
    gulp.watch('src/**/*.mjml', ['build:dev']);
    gulp.watch('src/css/global.css', ['build:dev']);
    gulp.watch('src/config/fake.json', ['build:dev']);
});

// Download translations
gulp.task('langs:dl', ['langs:clean'], function () {
    ['en', 'fr', 'es'].forEach(function(lang) {
        download('http://api.addons.prestashop.com/index.php?version=1&method=translations&type=emails&iso_lang='+lang)
        .pipe(buffer())
        .pipe(rename("lang.json"))
        .pipe(gulp.dest('langs/'+lang+'/'));
    })
});

// Remove previously downloaded langs
gulp.task('langs:clean', function () {
    return del(['langs']);
});

gulp.task('mjml:migrate', function () {
    return gulp.src(['src/*.mjml'])
        .pipe(buffer())
        .pipe(through.obj((file, enc, cb) => {
                let content = file.contents.toString();
                if (content.indexOf('<mj-container') >= 0) {
                    content = htmlBeautify(migrate(content), {
                        indent_size: 4,
                        wrap_attributes_indent_size: 4,
                        end_with_newline: true,
                    });
                    file = file.clone()
                    file.contents = new Buffer(content)
                }

                return cb(null, file);
        }))
        .pipe(replace('path="./src/', 'path="./'))
        .pipe(gulp.dest('src/'));
});

// Run all tasks if no args
gulp.task('default', ['watch']);
