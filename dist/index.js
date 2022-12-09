"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processors = exports.configs = void 0;
const processors_1 = require("./processors");
const configs = {
    ci: processors_1.ciConfig,
    diff: processors_1.diffConfig,
    staged: processors_1.stagedConfig,
};
exports.configs = configs;
const processors = { ci: processors_1.ci, diff: processors_1.diff, staged: processors_1.staged };
exports.processors = processors;
module.exports = { configs, processors };
