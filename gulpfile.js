const THEME = 'preston';

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
var clean = require('gulp-clean');
var fs = require('fs');

var settings = JSON.parse(fs.readFileSync(`themes/${THEME}/src/config/settings.json`));

// Compile files [dev mode]
gulp.task('build:dev', function () {
	process.chdir(`./themes/${THEME}/`);

	// var css = fs.readFileSync(`./src/css/global.css`, 'utf8');
	var fake = JSON.parse(fs.readFileSync(`./src/config/fake.json`));

	// return gulp.src(['./src/${THEME}/*.mjml'])
	return gulp.src(['./src/*.mjml'])

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
		// .pipe(replace('</head>', '<style>'+css+'</style></head>'))

		// Translate
		.pipe(i18n({
			// langDir: './langs',
			langDir: './../../langs',
			trace: true,
			createLangDirs: true
		}))

		// Replace variables with fake data
		.pipe(replace_task({
			patterns: [{json: fake}],
			usePrefix: false
		}))

		.pipe(gulp.dest(`./dist/html/`))
});

// Compile files with MJML
gulp.task('build:mjml', function () {
	process.chdir(`./themes/${THEME}/`);

	// var css = fs.readFileSync(`./src/css/global.css`, 'utf8');

	return gulp.src([`./src/*.mjml`])

		// Compile MJML to HTML
		.pipe(mjml(mjmlEngine))

		// We need to decode some curly brackets & dollar signs because of MJML
		.pipe(replace('%7B%7B', '{{'))
		.pipe(replace('%7D%7D', '}}'))
		.pipe(replace('&#36;', '$'))

		// CSS injection in the header
		// .pipe(replace('</head>', '<style>'+css+'</style></head>'))

		// Rename files
		.pipe(ext_replace('.tpl'))

		.pipe(gulp.dest(`./dist/work/`))
});

// Copy images in dist folder
gulp.task('build:copy:img', function() {
	return gulp.src(`./themes/${THEME}/src/img/*.{jpg,jpeg,png,gif}`)
		.pipe(gulp.dest(`./themes/${THEME}/dist/work/img/`));
});

// Copy tpls in dist folder
gulp.task('build:copy:tpl', function () {
	return gulp.src(`./themes/${THEME}/src/img/*.tpl`)
		.pipe(gulp.dest(`./themes/${THEME}/dist/work/tpl/`));
});

// Copy preview img in dist folder
gulp.task('build:copy:preview', function() {
	return gulp.src(`./themes/${THEME}/src/preview.jpg`)
		.pipe(gulp.dest(`./themes/${THEME}/dist/work/`));
});

// Copy settings in dist folder
gulp.task('build:copy:settings', function() {
	return gulp.src(`./themes/${THEME}/src/config/settings.json`)
		.pipe(gulp.dest(`./themes/${THEME}/dist/work/`));
});

// Compress folder
gulp.task('build:compress', ['build:copy:settings', 'build:mjml', 'build:copy:tpl', 'build:copy:img', 'build:copy:preview'], function() {
	return gulp.src(`./themes/${THEME}/dist/work/**/*`)
		.pipe(zip(settings.name+'.zip'))
		.pipe(gulp.dest(`./themes/${THEME}/dist/`));
});

// Copy images in dist folder
gulp.task('build', ['build:copy:settings', 'build:mjml', 'build:copy:img', 'build:copy:preview', 'build:copy:tpl', 'build:compress']);

// Watch changes
gulp.task('watch', function () {
	gulp.watch(`themes/${THEME}/src/**/*.mjml`, ['build:dev']);
	gulp.watch(`themes/${THEME}/src/css/global.css`, ['build:dev']);
	gulp.watch(`themes/${THEME}/src/config/fake.json`, ['build:dev']);
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
	return gulp.src('langs/', {read: false})
		.pipe(clean());
});

// Run all tasks if no args
gulp.task('default', ['watch']);
