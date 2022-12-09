"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Range = void 0;
class Range {
    constructor(inclusiveLowerBound, exclusiveUpperBound) {
        if (inclusiveLowerBound >= exclusiveUpperBound) {
            throw TypeError(`inclusiveLowerBound must be strictly less than exclusiveUpperBound: ${inclusiveLowerBound} >= ${exclusiveUpperBound}`);
        }
        this.inclusiveLowerBound = inclusiveLowerBound;
        this.exclusiveUpperBound = exclusiveUpperBound;
    }
    isWithinRange(n) {
        return this.inclusiveLowerBound <= n && n < this.exclusiveUpperBound;
    }
}
exports.Range = Range;
