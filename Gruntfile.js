'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('xpush-javascript.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    clean: {
      files: ['dist']
    },
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        src: ['src/<%= pkg.name %>.js', 'node_modules/socket.io-client/dist/socket.io.js'],
        dest: 'dist/<%= pkg.name %>.js'
      },
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'dist/<%= pkg.name %>.min.js'
      },
    },
    qunit: {
      files: ['test/**/*.html']
    },
    jshint: {
      gruntfile: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: 'Gruntfile.js'
      },
      src: {
        options: {
          jshintrc: 'src/.jshintrc'
        },
        src: ['src/**/*.js']
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: ['test/**/*.js']
      },
    },
    jsdoc : {
      basic : {
        src : ['tasks/**.js', 'tasks/lib/*.js'],
        options : {
          destination: 'doc/basic'
        }
      },
      docstrap : {
        src : ['src/**.js'],
        options : {
          destination : 'doc/docstrap',
            template : "node_modules/ink-docstrap/template",
            configure : "jsdoc.conf.json"
        }
      }
    },
    watch: {
      src: {
        files: 'src/<%= pkg.name %>.js',
        tasks: ['concat', 'uglify']
      },
    },
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Load local tasks.
  grunt.loadTasks('tasks');

  // Default task.
  //grunt.registerTask('default', ['jshint', 'test']);
  grunt.registerTask('docstrap', ['clean','jsdoc:docstrap']);

  // Default task.
  grunt.registerTask('default', ['jshint', 'qunit', 'clean', 'concat', 'uglify']);

};
