"use strict";
exports.__esModule = true;
require("source-map-support/register");
var parsing_1 = require("./parsing");
var fs = require("fs");
var yargs = require("yargs");
var argv = yargs
    .command('print', "Parse and print the resulted JSON.", function (yargs) {
    return yargs
        .option('src', {
        describe: "A list of source files to parse and output"
    })
        .option('lib', {
        // alias: 'v',
        "default": []
    })
        .option('out', {
        describe: "If set, write the result json into the specified file instead of printing it.",
        "default": null
    });
})
    .array("src")
    .array("lib")
    .argv;
var result = parsing_1.parseFiles(argv.src, argv.lib);
var json = JSON.stringify(result);
if (argv.out) {
    fs.writeFileSync(argv.out, json);
}
else {
    console.log(json);
}
