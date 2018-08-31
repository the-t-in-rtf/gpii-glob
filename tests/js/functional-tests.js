"use strict";
var fluid  = require("infusion");
var gpii   = fluid.registerNamespace("gpii");
var jqUnit = require("node-jqunit");
var path   = require("path");

require("../../");

jqUnit.module("End-to-end tests for directory searching.");

jqUnit.test("Test `findFiles` function.", function () {
    var rootPath = fluid.module.resolvePath("%gpii-glob/tests/find-fixture");
    var testDefs = {
        // TODO: Get these working, it fails but complains about the wrong number of expected assertions.
        invalidInclude: {
            message: "We should fail on an invalid include.",
            includes: ["./**"],
            excludes: [],
            minimatchOptions: {},
            expectedErrors: ["One or more glob patterns you have entered are invalid.  Cannot continue."]
        },
        invalidExclude: {
            message: "We should fail on an invalid exclude.",
            includes: [],
            excludes: ["c:\\"],
            minimatchOptions: {},
            expectedErrors: ["One or more glob patterns you have entered are invalid.  Cannot continue."]
        },
        bothInvalid: {
            message: "We should fail if there is both an invalid exclude and an invalid include.",
            includes: ["**"],
            excludes: ["./**"],
            minimatchOptions: {},
            expectedErrors: ["One or more glob patterns you have entered are invalid.  Cannot continue."]
        },
        singleDirectoryWildcard: {
            message: "We should be able to work with a directory wildcard.",
            includes: ["./src/**/*.js"],
            excludes: [],
            minimatchOptions: {},
            expected: ["./src/deep/deep-file.js", "./src/deep/deeper/deeper-file.js", "./src/src-file.js"],
            expectedErrors: []
        },
        nestedDirectoryWildcard: {
            message: "We should be able to work with nested directory wildcards.",
            includes: ["./src/**/deeper/*.js"],
            excludes: [],
            minimatchOptions: {},
            expected: ["./src/deep/deeper/deeper-file.js"],
            expectedErrors: []
        },
        excludes: {
            message: "We should be able to work with excludes.",
            includes: ["./src/**/*.js"],
            excludes: ["./src/**/deeper/*.js"],
            minimatchOptions: {},
            expected: ["./src/deep/deep-file.js", "./src/src-file.js"],
            expectedErrors: []
        },
        // TODO: There appears to be a bug in our logic that results in only using the first include.  FIX.
        multipleIncludes: {
            message: "We should be able to work with multiple includes.",
            includes: ["./src/*.js", "./src/**/deeper/*.js"],
            excludes: [],
            minimatchOptions: {},
            expected: ["./src/deep/deeper/deeper-file.js", "./src/src-file.js"],
            expectedErrors: []
        },
        negatedInclude: {
            message: "We should be able to work with negated includes.",
            includes: ["./src/**/*.js", "!./src/**/deeper/*.js"],
            excludes: [],
            minimatchOptions: {},
            expected: ["./src/deep/deep-file.js", "./src/src-file.js"],
            expectedErrors: []
        },
        negatedExclude: {
            message: "We should be able to work with negated excludes.",
            includes: ["./src/**/*.js"],
            excludes: ["./src/deep/**/*.js", "!./src/**/deeper/*.js"],
            minimatchOptions: {},
            expected: ["./src/deep/deeper/deeper-file.js", "./src/src-file.js"],
            expectedErrors: []
        },
        onlyNegatedExclude: {
            message: "Negated excludes should only affect included material.",
            includes: [],
            excludes: ["!./src/**/deeper/*.js"],
            minimatchOptions: {},
            expected: [],
            expectedErrors: []
        },
        matchBaseOption: {
            message: "We should be able to work with a `matchBase`-style pattern.",
            includes: ["deep-file.js"],
            excludes: ["./node_modules/**/*.js"],
            minimatchOptions: { matchBase: true },
            expected: ["./src/deep/deep-file.js", "./tests/deep/deep-file.js"],
            expectedErrors: []
        },
        dotOption: {
            message: "We should be able to include dotfiles in filename wildcard matching.",
            includes: ["./*.js"],
            excludes: [],
            minimatchOptions: { dot: true },
            expected: ["./.dot-file.js", "./root-file.js"],
            expectedErrors: []
        },
        noMinimatchOptions: {
            message: "We should be able to work without custom minimatch options.",
            includes: ["./*.js"],
            excludes: [],
            minimatchOptions: undefined,
            expected: ["./root-file.js"],
            expectedErrors: []
        }
    };

    /*
        We use expectFrameworkDiagnostic for our "failure" tests, but not for others.  That function
        calls expect and in essence increments the expected failure count on its own.

        https://github.com/fluid-project/infusion/blob/master/tests/test-core/jqUnit/js/jqUnit.js#L279

        That count starts at 0 by default.  So, we have to tell it about the non-failures, but let it handle
        incrementing "expect" for the failures.

        TODO: Discuss this with Antranig
     */
    jqUnit.expect(Object.keys(testDefs).length - 3);
    fluid.each(testDefs, function (testDef) {
        if (testDef.expectedErrors && testDef.expectedErrors.length) {
            jqUnit.expectFrameworkDiagnostic(
                testDef.message,
                function () {
                    gpii.glob.findFiles(rootPath, testDef.includes, testDef.excludes, testDef.minimatchOptions);
                },
                testDef.expectedErrors
            );
        }
        else {
            var output = gpii.glob.findFiles(rootPath, testDef.includes, testDef.excludes, testDef.minimatchOptions);

            // The output will always be full paths, so we need to add the root path to our expected output.
            var pathedExpected = testDef.expected.map(function (singlePath) {
                return path.posix.resolve(gpii.glob.sanitisePath(rootPath), singlePath);
            });

            jqUnit.assertDeepEq(testDef.message, pathedExpected, output);
        }
    });
});
