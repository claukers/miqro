// https://github.com/flitbit/diff/blob/master/index.js

// nodejs compatible on server side and in the browser.
function inherits(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
}

function Diff(kind, path) {
    Object.defineProperty(this, 'kind', {
        value: kind,
        enumerable: true
    });
    if (path && path.length) {
        Object.defineProperty(this, 'path', {
            value: path,
            enumerable: true
        });
    }
}

function DiffEdit(path, origin, value) {
    // @ts-ignore
    DiffEdit.super_.call(this, 'E', path);
    Object.defineProperty(this, 'lhs', {
        value: origin,
        enumerable: true
    });
    Object.defineProperty(this, 'rhs', {
        value: value,
        enumerable: true
    });
}
inherits(DiffEdit, Diff);

function DiffNew(path, value) {
    // @ts-ignore
    DiffNew.super_.call(this, 'N', path);
    Object.defineProperty(this, 'rhs', {
        value: value,
        enumerable: true
    });
}
inherits(DiffNew, Diff);

function DiffDeleted(path, value) {
    // @ts-ignore
    DiffDeleted.super_.call(this, 'D', path);
    Object.defineProperty(this, 'lhs', {
        value: value,
        enumerable: true
    });
}
inherits(DiffDeleted, Diff);

function DiffArray(path, index, item) {
    // @ts-ignore
    DiffArray.super_.call(this, 'A', path);
    Object.defineProperty(this, 'index', {
        value: index,
        enumerable: true
    });
    Object.defineProperty(this, 'item', {
        value: item,
        enumerable: true
    });
}
inherits(DiffArray, Diff);

function realTypeOf(subject) {
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
        object.forEach(function (item) {
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

const deepDiff = (lhs: any, rhs: any, changes: any[], prefilter?: PreFilter<any, any>, path?: string[] | null, key?: string | null, stack?: { lhs?: any; rhs?: any; }[] | null, orderIndependent?) => {
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
        currentPath.push(key);
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
            Object.getOwnPropertyDescriptor(stack[stack.length - 1].lhs, key));
    var rdefined = rtype !== 'undefined' ||
        (stack && (stack.length > 0) && stack[stack.length - 1].rhs &&
            Object.getOwnPropertyDescriptor(stack[stack.length - 1].rhs, key));

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

                    rhs.sort(function (a, b) {
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
                        pkeys[other] = null;
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

const observableDiff = (lhs: any, rhs: any, observer: (differenca: any) => void, prefilter?: PreFilter<any, any>, orderIndependent?) => {
    var changes = [];
    deepDiff(lhs, rhs, changes, prefilter, null, null, null, orderIndependent);
    if (observer) {
        for (var i = 0; i < changes.length; ++i) {
            observer(changes[i]);
        }
    }
    return changes;
}

const accumulateDiff = (lhs: any, rhs: any, prefilter?: PreFilter<any, any>, accum?): Array<Diff<any, any>> | undefined => {
    var observer = (accum) ?
        function (difference) {
            if (difference) {
                accum.push(difference);
            }
        } : undefined;
    // @ts-ignore
    var changes = observableDiff(lhs, rhs, observer, prefilter);
    return (accum) ? accum : (changes.length) ? changes : undefined;
}

export interface DiffNew<RHS> {
    kind: 'N';
    path?: any[] | undefined;
    rhs: RHS;
}

export interface DiffDeleted<LHS> {
    kind: 'D';
    path?: any[] | undefined;
    lhs: LHS;
}

export interface DiffEdit<LHS, RHS = LHS> {
    kind: 'E';
    path?: any[] | undefined;
    lhs: LHS;
    rhs: RHS;
}

export interface DiffArray<LHS, RHS = LHS> {
    kind: 'A';
    path?: any[] | undefined;
    index: number;
    item: Diff<LHS, RHS>;
}

export type Diff<LHS, RHS = LHS> = DiffNew<RHS> | DiffDeleted<LHS> | DiffEdit<LHS, RHS> | DiffArray<LHS, RHS>;

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

export const diff: DeepDiff<any> = accumulateDiff;