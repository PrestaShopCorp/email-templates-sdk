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
var fs = require('fs');
var del = require('del');
var through = require('through2');
var migrate = require('mjml-migrate').default;
var htmlBeautify = require('js-beautify').html;
const path = require('path');

// Get all folders in src/
function getFolders(dir) {
  return fs.readdirSync(dir)
    .filter(function(file) {
      return fs.statSync(path.join(dir, file)).isDirectory();
    });
}


const themes = getFolders('src');

themes.forEach(function(theme) {
  gulp.task(`build:dev:${theme}`, function () {

    var css = fs.readFileSync(__dirname+`/src/${theme}/css/global.css`, 'utf8');
      var fake_json_path = `./src/${theme}/config/fake.json`;
      delete require.cache[require.resolve(fake_json_path)]
      var fake = require(fake_json_path);

      return gulp.src([`src/${theme}/*.mjml`])

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

          .pipe(gulp.dest(`./dist/${theme}/html/`))
  });

  // Compile files with MJML
  gulp.task(`build:mjml:${theme}`, function () {

      var css = fs.readFileSync(__dirname + `/src/${theme}/css/global.css`, 'utf8');

      return gulp.src([`src/${theme}/*.mjml`])

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

          .pipe(gulp.dest(`./dist/${theme}`))
  });

  // Copy images in dist folder
  gulp.task(`build:copy:img:${theme}`, function() {

      return gulp.src(`src/${theme}img/*.{jpg,jpeg,png,gif}`)
                      .pipe(gulp.dest(`./dist/${theme}/img/`));
  });

  // Copy tpls in dist folder
  gulp.task(`build:copy:tpl:${theme}`, function () {

          return gulp.src(`src/${theme}*.tpl`)
              .pipe(gulp.dest(`./dist/${theme}/tpl/`));
  });

  // Copy preview img in dist folder
  gulp.task(`build:copy:preview:${theme}`, function() {

      return gulp.src(`src/${theme}/preview.jpg`)
                      .pipe(gulp.dest(`./dist/${theme}/`));
  });

  // Copy settings in dist folder
  gulp.task(`build:copy:settings:${theme}`, function() {

      return gulp.src(`src/${theme}/config/settings.json`)
                  .pipe(gulp.dest(`./dist/${theme}/`));
  });

  // Compress folder
  gulp.task(`build:compress:${theme}`, function() {
      return gulp.src(`./dist/${theme}/**/*`)
                          .pipe(zip(`${theme}.zip`))
                          .pipe(gulp.dest(`./dist/${theme}`))
  });

  // Remove dist
  gulp.task(`build:clean:${theme}`, function () {
      return del([`dist/${theme}`]);
  });

  // Copy images in dist folder
  gulp.task(`build:${theme}`, gulp.series(`build:clean:${theme}`, gulp.parallel(`build:copy:settings:${theme}`, `build:mjml:${theme}`, `build:copy:img:${theme}`, `build:copy:preview:${theme}`, `build:copy:tpl:${theme}`), `build:compress:${theme}`));

  // Watch changes
  gulp.task(`watch:${theme}`, function () {
    gulp.watch(`src/${theme}/**/*.mjml`, gulp.series(`build:dev:${theme}`));
    gulp.watch(`src/${theme}/css/global.css`, gulp.series(`build:dev:${theme}`));
    gulp.watch(`src/${theme}/config/fake.json`, gulp.series(`build:dev:${theme}`));
  });

  gulp.task(`mjml:migrate:${theme}`, function () {
    return gulp.src([`src/${theme}/*.mjml`])
        .pipe(buffer())
        .pipe(replace(/<(\/?)mj-html/g, '<$1mj-raw'))
        .pipe(through.obj((file, enc, cb) => {
                let content = file.contents.toString();
                if (content.indexOf('<mj-container') >= 0) {
                    content = htmlBeautify(migrate(content), {
                        indent_size: 4,
                        wrap_attributes_indent_size: 4,
                        end_with_newline: true,
                    });
                    file = file.clone();
                    file.contents = Buffer.from(content);
                }

                return cb(null, file);
        }))
        .pipe(replace(`path="./src/${theme}/`, 'path="./'))
        .pipe(gulp.dest(`src/${theme}`));
  });

});

gulp.task('build',
   gulp.parallel(
    themes.map(function(theme) { return `build:${theme}` })
   )
);


gulp.task('watch',
   gulp.parallel(
    themes.map(function(theme) { return `watch:${theme}` })
   )
);

gulp.task('mjml:migrate',
   gulp.parallel(
    themes.map(function(theme) { return `mjml:migrate:${theme}` })
   )
);

gulp.task(`clean:all`, function () {
    return del([`dist/`]);
});


// Remove previously downloaded langs
gulp.task('langs:clean', function () {
    return del(['langs']);
});

// Download translations
gulp.task('langs:dl', gulp.series('langs:clean', function () {
    return download(['en', 'fr', 'es'].map(lang => ({
        file: `${lang}/lang.json`,
        url: `https://api.addons.prestashop.com/index.php?version=1&method=translations&type=emails&iso_lang=${lang}`
    })))
        .pipe(gulp.dest(`langs/`));
}));


// Run all tasks if no args
gulp.task('default', gulp.series('watch'));
