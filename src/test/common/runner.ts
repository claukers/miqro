import { Console } from "console";
import { format } from "util";

export type TestFunction = () => void | Promise<void>;
const DEFAULT_TIMEOUT = 2000;

interface Test { run: TestFunction; title: string; category?: string; fullName: string; }

const tests: Test[] = [];

export const getTestCount = () => tests.length;

export const it = (title: string, impl: TestFunction, options?: {
  category?: string;
  timeout?: number;
  before?: TestFunction;
  after?: TestFunction;
}, logger: {
  log: (...args: any[]) => void
} | Console = new Console(process.stdout)): void => {
  const category = options && options.category ? options.category : undefined;
  const fullName = `${category ? `${category} [` : ""}${title}${category ? "]" : ""}`;
  tests.push({
    run: () => new Promise((resolve, reject) => {
      const timeoutMS = options && options.timeout ? options.timeout : DEFAULT_TIMEOUT;
      const timeout = setTimeout(() => {
        reject(new Error(format("%s failed\x1b[31m\n%s timeout %o\x1b", fullName, fullName, timeoutMS)));
      }, timeoutMS);
      try {
        (async () => {
          if (options && options.before) {
            await options.before();
          }
          const startMS = Date.now();
          await impl();
          const took = Date.now() - startMS;
          if (options && options.after) {
            await options.after();
          }
          return took;
        })().then((took) => {
          clearTimeout(timeout);
          logger.log("\x1b[32mpassed %s (took %sms)\x1b[0m", fullName, took);
          resolve();
        }).catch(e => {
          clearTimeout(timeout);
          reject(new Error(format("%s failed\n%s finished with errors %o", fullName, fullName, e)));
        });
      } catch (e) {
        clearTimeout(timeout);
        reject(new Error(format("%s failed\n%s finished with errors %o", fullName, fullName, e)));
      }
    }), title,
    category,
    fullName
  });
};

export const runTests = async (title?: string | string[], logger: {
  error: (...args: any[]) => void;
} | Console = new Console(process.stdout)): Promise<{
  passed: number;
  total: number;
  ignored: number;
  failed: {
    error: any;
    fullName: string;
  }[];
}> => {
  const titles = title ? title instanceof Array ? title : [title] : [undefined];
  const ret: {
    passed: number;
    total: number;
    ignored: number;
    failed: {
      error: any;
      fullName: string;
    }[];
  } = {
    total: tests.length,
    ignored: 0,
    passed: 0,
    failed: []
  };
  for (const test of tests) {
    for (const title of titles) {
      if (title && test.fullName.indexOf(title) !== -1 || !title) {
        try {
          await test.run();
          ret.passed++;
        } catch (e) {
          logger.error("\x1b[31m%s\x1b[0m", e);
          ret.failed.push({
            error: e,
            fullName: test.fullName
          })
        }
      } else {
        ret.ignored++;
      }
    }
  }
  return ret;
};

export const runTestModules = async (modules: string[], title?: string | string[], logger: {
  error: (...args: any[]) => void;
} | Console = new Console(process.stdout)): Promise<{
  passed: number;
  total: number;
  ignored: number;
  failed: {
    error: any;
    fullName: string;
  }[];
}> => {
  for (const path of modules) {
    require(path);
  }
  return await runTests(title, logger);
}
