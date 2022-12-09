"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasCleanIndex = exports.getUntrackedFileList = exports.getRangesForDiff = exports.getDiffForFile = exports.getDiffFileList = exports.fetchFromOrigin = void 0;
const child_process = __importStar(require("child_process"));
const path_1 = require("path");
const Range_1 = require("./Range");
const COMMAND = "git";
const OPTIONS = { maxBuffer: 1024 * 1024 * 100 };
const getDiffForFile = (filePath, staged = false) => {
    const args = [
        "diff",
        "--diff-algorithm=histogram",
        "--diff-filter=ACM",
        "--find-renames=100%",
        "--no-ext-diff",
        "--relative",
        staged && "--staged",
        "--unified=0",
        process.env.ESLINT_PLUGIN_DIFF_COMMIT ?? "HEAD",
        "--",
        (0, path_1.resolve)(filePath),
    ].reduce((acc, cur) => (typeof cur === "string" ? [...acc, cur] : acc), []);
    return child_process.execFileSync(COMMAND, args, OPTIONS).toString();
};
exports.getDiffForFile = getDiffForFile;
const getDiffFileList = (staged = false) => {
    const args = [
        "diff",
        "--diff-algorithm=histogram",
        "--diff-filter=ACM",
        "--find-renames=100%",
        "--name-only",
        "--no-ext-diff",
        "--relative",
        staged && "--staged",
        process.env.ESLINT_PLUGIN_DIFF_COMMIT ?? "HEAD",
        "--",
    ].reduce((acc, cur) => (typeof cur === "string" ? [...acc, cur] : acc), []);
    return child_process
        .execFileSync(COMMAND, args, OPTIONS)
        .toString()
        .trim()
        .split("\n")
        .map((filePath) => (0, path_1.resolve)(filePath));
};
exports.getDiffFileList = getDiffFileList;
const hasCleanIndex = (filePath) => {
    const args = [
        "diff",
        "--no-ext-diff",
        "--quiet",
        "--relative",
        "--unified=0",
        "--",
        (0, path_1.resolve)(filePath),
    ];
    try {
        child_process.execFileSync(COMMAND, args, OPTIONS);
    }
    catch (err) {
        return false;
    }
    return true;
};
exports.hasCleanIndex = hasCleanIndex;
const fetchFromOrigin = (branch) => {
    const args = ["fetch", "--quiet", "origin", branch];
    child_process.execFileSync(COMMAND, args, OPTIONS);
};
exports.fetchFromOrigin = fetchFromOrigin;
let untrackedFileListCache;
const getUntrackedFileList = (staged = false, shouldRefresh = false) => {
    if (staged) {
        return [];
    }
    if (untrackedFileListCache === undefined || shouldRefresh) {
        const args = ["ls-files", "--exclude-standard", "--others"];
        untrackedFileListCache = child_process
            .execFileSync(COMMAND, args, OPTIONS)
            .toString()
            .trim()
            .split("\n")
            .map((filePath) => (0, path_1.resolve)(filePath));
    }
    return untrackedFileListCache;
};
exports.getUntrackedFileList = getUntrackedFileList;
const isHunkHeader = (input) => {
    const hunkHeaderRE = /^@@ [^@]* @@/u;
    return hunkHeaderRE.exec(input);
};
const getRangeForChangedLines = (line) => {
    /**
     * Example values of the RegExp's group:
     *
     * start: '7',
     * linesCountDelimiter: ',2',
     * linesCount: '2',
     */
    const rangeRE = /^@@ .* \+(?<start>\d+)(?<linesCountDelimiter>,(?<linesCount>\d+))? @@/u;
    const range = rangeRE.exec(line);
    if (range === null) {
        throw Error(`Couldn't match regex with line '${line}'`);
    }
    const groups = {
        // Fallback value to ensure hasAddedLines resolves to false
        start: "0",
        linesCountDelimiter: ",0",
        linesCount: "0",
        ...range.groups,
    };
    const linesCount = groups.linesCountDelimiter && groups.linesCount
        ? parseInt(groups.linesCount)
        : 1;
    const hasAddedLines = linesCount !== 0;
    const start = parseInt(groups.start);
    const end = start + linesCount;
    return hasAddedLines ? new Range_1.Range(start, end) : null;
};
const getRangesForDiff = (diff) => diff.split("\n").reduce((ranges, line) => {
    if (!isHunkHeader(line)) {
        return ranges;
    }
    const range = getRangeForChangedLines(line);
    if (range === null) {
        return ranges;
    }
    return [...ranges, range];
}, []);
exports.getRangesForDiff = getRangesForDiff;
