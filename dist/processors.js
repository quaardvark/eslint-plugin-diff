"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnstagedChangesError = exports.stagedConfig = exports.staged = exports.diffConfig = exports.diff = exports.ciConfig = exports.ci = void 0;
const ci_1 = require("./ci");
const git_1 = require("./git");
if (process.env.CI !== undefined) {
    const branch = process.env.ESLINT_PLUGIN_DIFF_COMMIT ?? (0, ci_1.guessBranch)();
    if (branch !== undefined) {
        const branchWithoutOrigin = branch.replace(/^origin\//, "");
        const branchWithOrigin = `origin/${branchWithoutOrigin}`;
        (0, git_1.fetchFromOrigin)(branchWithoutOrigin);
        process.env.ESLINT_PLUGIN_DIFF_COMMIT = branchWithOrigin;
    }
}
/**
 * Exclude unchanged files from being processed
 *
 * Since we're excluding unchanged files in the post-processor, we can exclude
 * them from being processed in the first place, as a performance optimization.
 * This is increasingly useful the more files there are in the repository.
 */
const getPreProcessor = (staged) => (text, filename) => {
    const diffFileList = (0, git_1.getDiffFileList)(staged);
    let untrackedFileList = (0, git_1.getUntrackedFileList)(staged);
    const shouldRefresh = !diffFileList.includes(filename) && !untrackedFileList.includes(filename);
    if (shouldRefresh) {
        untrackedFileList = (0, git_1.getUntrackedFileList)(staged, true);
    }
    const shouldBeProcessed = process.env.VSCODE_CLI !== undefined ||
        diffFileList.includes(filename) ||
        untrackedFileList.includes(filename);
    return shouldBeProcessed ? [text] : [];
};
const isLineWithinRange = (line) => (range) => range.isWithinRange(line);
/**
 * @internal
 */
const getUnstagedChangesError = (filename) => {
    // When we only want to diff staged files, but the file is partially
    // staged, the ranges of the staged diff might not match the ranges of the
    // unstaged diff and could cause a conflict, so we return a fatal
    // error-message instead.
    const fatal = true;
    const message = `${filename} has unstaged changes. Please stage or remove the changes.`;
    const severity = 2;
    const fatalError = {
        fatal,
        message,
        severity,
        column: 0,
        line: 0,
        ruleId: null,
    };
    return [fatalError];
};
exports.getUnstagedChangesError = getUnstagedChangesError;
const getPostProcessor = (staged = false) => (messages, filename) => {
    if (messages.length === 0) {
        // No need to filter, just return
        return [];
    }
    const untrackedFileList = (0, git_1.getUntrackedFileList)(staged);
    if (untrackedFileList.includes(filename)) {
        // We don't need to filter the messages of untracked files because they
        // would all be kept anyway, so we return them as-is.
        return messages.flat();
    }
    if (staged && !(0, git_1.hasCleanIndex)(filename)) {
        return getUnstagedChangesError(filename);
    }
    const rangesForDiff = (0, git_1.getRangesForDiff)((0, git_1.getDiffForFile)(filename, staged));
    return messages.flatMap((message) => {
        const filteredMessage = message.filter(({ fatal, line }) => {
            if (fatal === true) {
                return true;
            }
            const isLineWithinSomeRange = rangesForDiff.some(isLineWithinRange(line));
            return isLineWithinSomeRange;
        });
        return filteredMessage;
    });
};
const getProcessors = (processorType) => {
    const staged = processorType === "staged";
    return {
        preprocess: getPreProcessor(staged),
        postprocess: getPostProcessor(staged),
        supportsAutofix: true,
    };
};
const ci = process.env.CI !== undefined ? getProcessors("ci") : {};
exports.ci = ci;
const diff = getProcessors("diff");
exports.diff = diff;
const staged = getProcessors("staged");
exports.staged = staged;
const diffConfig = {
    plugins: ["diff"],
    overrides: [
        {
            files: ["*"],
            processor: "diff/diff",
        },
    ],
};
exports.diffConfig = diffConfig;
const ciConfig = process.env.CI === undefined
    ? {}
    : {
        plugins: ["diff"],
        overrides: [
            {
                files: ["*"],
                processor: "diff/ci",
            },
        ],
    };
exports.ciConfig = ciConfig;
const stagedConfig = {
    plugins: ["diff"],
    overrides: [
        {
            files: ["*"],
            processor: "diff/staged",
        },
    ],
};
exports.stagedConfig = stagedConfig;
