/*!
  * PrestaShop Emails SDK
  * Copyright 2016-2017 PrestaShop and contributors (https://github.com/PrestaShop/email-templates-sdk/blob/master/package.json)
  * Licensed under MIT (https://github.com/PrestaShop/email-templates-sdk/blob/master/LICENSE.md)
  *
  * @version  2.0.0
  */
var gulp = require('gulp');
var gulpsync = require('gulp-sync')(gulp);
var gutil = require('gulp-util');
var mjml = require('gulp-mjml');
var mjmlEngine = require('mjml');
var i18n = require('gulp-html-i18n');
var download = require("gulp-download-stream");
var buffer = require('vinyl-buffer');
var replace_task = require('gulp-replace-task');
var ext_replace = require('gulp-ext-replace');
var zip = require('gulp-zip');
var replace = require('gulp-replace');
var rename = require("gulp-rename");
var clean = require('gulp-clean');
var fs = require('fs');

var argv = require('yargs')
    .alias('t', 'theme')
    .alias('v', 'verbose')
    .describe('t', 'Theme name and folder')
    .describe('v', 'Verbose mode')
    .default('v', false)
    .argv;

var config = {};


/**
 * TASK: DEFAULT
 */
gulp.task('default', ['build']);

/**
 * TASK: BUILD
 *
 * Create Zip package from sources
 */
gulp.task('build', gulpsync.sync
(
    [
        'init',
        'build:copy:settings',
        'build:mjml',
        'build:copy:img',
        'build:copy:preview',
        'build:copy:tpl',
        'build:compress',
    ]
));

/**
 * TASK: TEST
 *
 * Create HTML files from sources
 */
gulp.task('test', gulpsync.sync
(
    [
        'init',
        'build:test',
    ]
));

/**
 * TASK: WATCH
 *
 * Watch MJML / Fixtures modifications and launch TEST task
 */
gulp.task('watch', gulpsync.sync
(
    [
        'init',
        'watch:test',
    ]
));



/**
 * TASK: INIT
 *
 * Load global and theme configuration
 */
gulp.task('init', function(cb)
{
    // Global configuration
    if (argv.t === undefined) {
        gutil.log(gutil.colors.red('No theme defined: set --theme option'));
        process.exit(1);
    }
    config.theme = argv.t;
    config.debug = argv.v;

    // Set paths
    config.path = {};
    config.path.root = `./themes/${config.theme}`;
    config.path.langs = `../../langs`;
    config.path.in = {};
    config.path.in.root = `./src`;
    config.path.in.settings = `${config.path.in.root}/config/settings.json`;
    config.path.in.fake = `${config.path.in.root}/config/fake.json`;
    config.path.in.mjml = config.path.in.root;
    config.path.in.images = `${config.path.in.root}/img`;
    config.path.out = {};
    config.path.out.root = `./dist`;
    config.path.out.tmp = `${config.path.out.root}/work`;
    config.path.out.dev = `${config.path.out.root}/html`;

    if (config.debug) {
        gutil.log(gutil.colors.cyan('Global configuration:'), gutil.colors.yellow(JSON.stringify(config)));
    }

    process.chdir(config.path.root);

    // Load theme configuration file
    if (!fs.existsSync(config.path.in.settings)) {
        gutil.log(gutil.colors.red('Missing theme settings file: ' + config.path.in.settings));
        process.exit(1);
    }
    config.settings = JSON.parse(fs.readFileSync(config.path.in.settings));

    if (config.debug) {
        gutil.log(gutil.colors.cyan('Theme configuration:'), gutil.colors.yellow(JSON.stringify(config.settings)));
    }

    cb();
});

/**
 * TASK: BUILD:COPY:SETTINGS
 *
 * Copy theme settings file in `config.path.out.tmp` folder
 */
gulp.task('build:copy:settings', function()
{
    return gulp.src(config.path.in.settings)
        .pipe(gulp.dest(config.path.out.tmp));
});

/**
 * TASK: BUILD:MJML
 *
 * Compile MJML files to HTML.tpl in `config.path.out.tmp` folder
 */
gulp.task('build:mjml', function ()
{
    return gulp.src([`${config.path.in.mjml}/*.mjml`])
        // Compile MJML to HTML
        .pipe(mjml(mjmlEngine))

        // We need to decode some curly brackets & dollar signs because of MJML
        .pipe(replace('%7B%7B', '{{'))
        .pipe(replace('%7D%7D', '}}'))
        .pipe(replace('&#36;', '$'))

        // Rename extension
        .pipe(ext_replace('.tpl'))

        .pipe(gulp.dest(config.path.out.tmp))
});

/**
 * TASK: BUILD:COPY:IMG
 *
 * Copy theme images in `config.path.out.tmp/img` folder
 */
gulp.task('build:copy:img', function()
{
    return gulp.src(`${config.path.in.images}/*.{jpg,jpeg,png,gif}`)
        .pipe(gulp.dest(`${config.path.out.tmp}/img/`));
});

/**
 * TASK: BUILD:COPY:PREVIEW
 *
 * Copy theme preview image in `config.path.out.tmp` folder
 */
gulp.task('build:copy:preview', function()
{
    return gulp.src(`${config.path.in.root}/preview.jpg`)
        .pipe(gulp.dest(config.path.out.tmp));
});

/**
 * TASK: BUILD:COPY:TPL
 *
 * Copy theme standard tpl in `config.path.out.tmp/tpl` folder
 */
gulp.task('build:copy:tpl', function ()
{
    return gulp.src(`${config.path.in.root}/*.tpl`)
        .pipe(gulp.dest(`${config.path.out.tmp}/tpl/`));
});

/**
 * TASK: BUILD:COMPRESS
 *
 * Packages temp folder in a Zip archive in `config.path.out.root` folder
 */
gulp.task('build:compress', function() {
    return gulp.src(`${config.path.out.tmp}/**/*`)
        .pipe(zip(config.theme + '.zip'))
        .pipe(gulp.dest(config.path.out.root));
});



/**
 * TASK: BUILD:TEST
 *
 * Compile MJML files to HTML.html in `config.path.out.dev` folder for each lang and fixtures injection
 */
gulp.task('build:test', function ()
{
    // Load theme fixtures file
    if (!fs.existsSync(config.path.in.fake)) {
        gutil.log(gutil.colors.red('Missing theme fixtures file: ' + config.path.in.fake));
        process.exit(1);
    }
    config.fixtures = JSON.parse(fs.readFileSync(config.path.in.fake));

    return gulp.src([`${config.path.in.mjml}/*.mjml`])

        // Compile MJML to HTML
        .pipe(mjml(mjmlEngine))

        // Delete conditions
        .pipe(replace('{{/if}}', ''))
        .pipe(replace(/{{if \$[a-z_]+}}/ig, ''))

        // We need to decode some curly brackets & dollar signs because of MJML
        .pipe(replace('%7B%7B', '{{'))
        .pipe(replace('%7D%7D', '}}'))
        .pipe(replace('&#36;', '$'))

        // Translate
        .pipe(i18n({
            langDir: config.path.langs,
            trace: true,
            createLangDirs: true
        }))

        // Replace variables with fake data
        .pipe(replace_task({
            patterns: [{json: config.fixtures}],
            usePrefix: false
        }))

        .pipe(gulp.dest(config.path.out.dev))
});



/**
 * TASK: WATCH:TEST
 *
 * Listen to MJML files and Fixtures file modification
 */
gulp.task('watch:test', function ()
{
    gulp.watch(`${config.path.in.mjml}/**/*.mjml`, ['build:test']);
    gulp.watch(config.path.in.fake, ['build:test']);
});



/**
 * TASK: LANGS:DL
 *
 * Download language files from PrestaShop Addons API
 */
gulp.task('langs:dl', ['langs:clean'], function ()
{
    ['en', 'fr', 'es'].forEach(function(lang) {
        download('http://api.addons.prestashop.com/index.php?version=1&method=translations&type=emails&iso_lang=' + lang)
        .pipe(buffer())
        .pipe(rename('lang.json'))
        .pipe(gulp.dest('langs/' + lang + '/'));
    })
});

/**
 * TASK: LANGS:CLEAN
 *
 * Remove previously downloaded languages
 */
gulp.task('langs:clean', function ()
{
    return gulp.src('langs/', {read: false})
        .pipe(clean());
});
