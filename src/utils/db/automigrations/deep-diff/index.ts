// https://github.com/flitbit/diff/blob/master/index.js

class Diff<LHS = any, RHS = any> {
    public rhs: RHS | undefined;
    public lhs: LHS | undefined;
    constructor(public kind: "A" | "E" | "N" | "D", public path: string[] | undefined) {
    }
}

class DiffEdit<L, R> extends Diff<L, R> {
    constructor(path: string[], lhs: L, rhs: R) {
        super("E", path);
        this.lhs = lhs;
        this.rhs = rhs;
    }
}

class DiffNew<L, R> extends Diff<L, R> {
    constructor(path: string[] | undefined, rhs: R) {
        super("N", path);
        this.rhs = rhs;
    }
}

class DiffDeleted<L, R> extends Diff<L, R>{
    constructor(path: string[] | undefined, public lhs: L) {
        super("D", path);
        this.lhs = lhs;
    }
}

class DiffArray extends Diff {
    public item: any;
    constructor(path: string[], public index: number, item: any) {
        super("A", path);
        this.item = item;
    }
}

function realTypeOf(subject: any) {
    var type = typeof subject;
    if (type !== 'object') {
        return type;
    }

    if (subject === Math) {
        return 'math';
    } else if (subject === null) {
        return 'null';
    } else if (Array.isArray(subject)) {
        return 'array';
    } else if (Object.prototype.toString.call(subject) === '[object Date]') {
        return 'date';
    } else if (typeof subject.toString === 'function' && /^\/.*\//.test(subject.toString())) {
        return 'regexp';
    }
    return 'object';
}

// http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
const hashThisString = (string: string): number => {
    var hash = 0;
    if (string.length === 0) { return hash; }
    for (var i = 0; i < string.length; i++) {
        var char = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

// Gets a hash of the given object in an array order-independent fashion
// also object key order independent (easier since they can be alphabetized)
const getOrderIndependentHash = (object: any): number => {
    var accum = 0;
    var type = realTypeOf(object);

    if (type === 'array') {
        object.forEach(function (item: any) {
            // Addition is commutative so this is order indep
            accum += getOrderIndependentHash(item);
        });

        var arrayString = '[type: array, hash: ' + accum + ']';
        return accum + hashThisString(arrayString);
    }

    if (type === 'object') {
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                var keyValueString = '[ type: object, key: ' + key + ', value hash: ' + getOrderIndependentHash(object[key]) + ']';
                accum += hashThisString(keyValueString);
            }
        }

        return accum;
    }

    // Non object, non array...should be good?
    var stringToHash = '[ type: ' + type + ' ; value: ' + object + ']';
    return accum + hashThisString(stringToHash);
}

const deepDiff = (lhs: any, rhs: any, changes: any[], prefilter?: PreFilter<any, any>, path?: string[] | null, key?: string | null | number, stack?: { lhs?: any; rhs?: any; }[] | null, orderIndependent?: boolean) => {
    changes = changes || [];
    path = path || [];
    stack = stack || [];
    var currentPath = path.slice(0);
    if (typeof key !== 'undefined' && key !== null) {
        if (prefilter) {
            if (typeof (prefilter) === 'function' && prefilter(currentPath, key)) {
                return;
            } else if (typeof (prefilter) === 'object') {
                if (prefilter.prefilter && prefilter.prefilter(currentPath, key)) {
                    return;
                }
                if (prefilter.normalize) {
                    var alt = prefilter.normalize(currentPath, key, lhs, rhs);
                    if (alt) {
                        lhs = alt[0];
                        rhs = alt[1];
                    }
                }
            }
        }
        currentPath.push(key as string);
    }

    // Use string comparison for regexes
    if (realTypeOf(lhs) === 'regexp' && realTypeOf(rhs) === 'regexp') {
        lhs = lhs.toString();
        rhs = rhs.toString();
    }

    var ltype = typeof lhs;
    var rtype = typeof rhs;
    var i, j, k, other;

    var ldefined = ltype !== 'undefined' ||
        (stack && (stack.length > 0) && stack[stack.length - 1].lhs &&
            Object.getOwnPropertyDescriptor(stack[stack.length - 1].lhs, key as string));
    var rdefined = rtype !== 'undefined' ||
        (stack && (stack.length > 0) && stack[stack.length - 1].rhs &&
            Object.getOwnPropertyDescriptor(stack[stack.length - 1].rhs, key as string));

    if (!ldefined && rdefined) {
        changes.push(new DiffNew(currentPath, rhs));
    } else if (!rdefined && ldefined) {
        changes.push(new DiffDeleted(currentPath, lhs));
    } else if (realTypeOf(lhs) !== realTypeOf(rhs)) {
        changes.push(new DiffEdit(currentPath, lhs, rhs));
    } else if (realTypeOf(lhs) === 'date' && (lhs - rhs) !== 0) {
        changes.push(new DiffEdit(currentPath, lhs, rhs));
    } else if (ltype === 'object' && lhs !== null && rhs !== null) {
        for (i = stack.length - 1; i > -1; --i) {
            if (stack[i].lhs === lhs) {
                other = true;
                break;
            }
        }
        if (!other) {
            stack.push({ lhs: lhs, rhs: rhs });
            if (Array.isArray(lhs)) {
                // If order doesn't matter, we need to sort our arrays
                if (orderIndependent) {
                    lhs.sort(function (a, b) {
                        return getOrderIndependentHash(a) - getOrderIndependentHash(b);
                    });

                    rhs.sort(function (a: any, b: any) {
                        return getOrderIndependentHash(a) - getOrderIndependentHash(b);
                    });
                }
                i = rhs.length - 1;
                j = lhs.length - 1;
                while (i > j) {
                    changes.push(new DiffArray(currentPath, i, new DiffNew(undefined, rhs[i--])));
                }
                while (j > i) {
                    changes.push(new DiffArray(currentPath, j, new DiffDeleted(undefined, lhs[j--])));
                }
                for (; i >= 0; --i) {
                    deepDiff(lhs[i], rhs[i], changes, prefilter, currentPath, i, stack, orderIndependent);
                }
            } else {
                // @ts-ignore
                var akeys = Object.keys(lhs).concat(Object.getOwnPropertySymbols(lhs));
                // @ts-ignore
                var pkeys = Object.keys(rhs).concat(Object.getOwnPropertySymbols(rhs));
                for (i = 0; i < akeys.length; ++i) {
                    k = akeys[i];
                    other = pkeys.indexOf(k);
                    if (other >= 0) {
                        deepDiff(lhs[k], rhs[k], changes, prefilter, currentPath, k, stack, orderIndependent);
                        pkeys[other] = null as any;
                    } else {
                        deepDiff(lhs[k], undefined, changes, prefilter, currentPath, k, stack, orderIndependent);
                    }
                }
                for (i = 0; i < pkeys.length; ++i) {
                    k = pkeys[i];
                    if (k) {
                        deepDiff(undefined, rhs[k], changes, prefilter, currentPath, k, stack, orderIndependent);
                    }
                }
            }
            stack.length = stack.length - 1;
        } else if (lhs !== rhs) {
            // lhs is contains a cycle at this element and it differs from rhs
            changes.push(new DiffEdit(currentPath, lhs, rhs));
        }
    } else if (lhs !== rhs) {
        if (!(ltype === 'number' && isNaN(lhs) && isNaN(rhs))) {
            changes.push(new DiffEdit(currentPath, lhs, rhs));
        }
    }
}

const observableDiff = (lhs: any, rhs: any, observer: (difference: any) => void, prefilter?: PreFilter<any, any>, orderIndependent?: boolean): Diff<any, any>[] => {
    const changes: Diff<any, any>[] = [];
    deepDiff(lhs, rhs, changes, prefilter, null, null, null, orderIndependent);
    if (observer) {
        for (var i = 0; i < changes.length; ++i) {
            observer(changes[i]);
        }
    }
    return changes;
}

const accumulateDiff = (lhs: any, rhs: any, prefilter?: PreFilter<any, any>, accum?: Diff<any, any>[] | undefined): Array<Diff<any, any>> | undefined => {
    var observer = (accum) ?
        function (difference: any) {
            if (difference) {
                accum.push(difference);
            }
        } : undefined;
    // @ts-ignore
    var changes = observableDiff(lhs, rhs, observer, prefilter);
    return (accum) ? accum : (changes.length) ? changes : undefined;
}

export type PreFilterFunction = (path: any[], key: any) => boolean;
export interface PreFilterObject<LHS, RHS = LHS> {
    prefilter?(path: any[], key: any): boolean;
    normalize?(currentPath: any, key: any, lhs: LHS, rhs: RHS): [LHS, RHS] | undefined;
}
export type PreFilter<LHS, RHS = LHS> = PreFilterFunction | PreFilterObject<LHS, RHS>;

export interface Accumulator<LHS, RHS = LHS> {
    push(diff: Diff<LHS, RHS>): void;
    length: number;
}

export type Observer<LHS, RHS = LHS> = (diff: Diff<LHS, RHS>) => void;

export type Filter<LHS, RHS = LHS> = (target: LHS, source: RHS, change: Diff<LHS, RHS>) => boolean;

export type DeepDiff<LHS, RHS = LHS> = (lhs: LHS, rhs: RHS, prefilter?: PreFilter<LHS, RHS>) => Array<Diff<LHS, RHS>> | undefined;

export const DEEPDIFF: {
    diff: DeepDiff<any>
} = {
    diff: accumulateDiff
};