'use strict';

module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-mocha-test');

    // Project configuration.
    grunt.initConfig({
            pkg: '<json:package.json>',
            lint: {
                files: ['grunt.js', 'lib/**/ *.js', 'test/**/ *.js', 'bin/*']
            },
            watch: {
                files: '<config:lint.files>',
                tasks: 'default'
            },
            jshint: {
                options: {
                    curly: true,
                    eqeqeq: true,
                    immed: true,
                    latedef: true,
                    newcap: true,
                    noarg: true,
                    sub: true,
                    undef: true,
                    boss: true,
                    eqnull: true,
                    node: true,
                    expr: true
                },
                globals: {
                    exports: true,
                    it: true,
                    describe: true
                }
            },
            mochaTest: {
                files: ['test/**/*.js']
            },
            mochaTestConfig: {
                options: {
                    reporter: 'spec'
                }
            }
        }
    );

    // Default task.
    grunt.registerTask('test', 'mochaTest');
    grunt.registerTask('default', 'lint test');

};
