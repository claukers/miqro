import { resolve } from "path";
import { CLIUtil } from "@miqro/core";
import { runTestModules } from "../test";

export const main = async (): Promise<void> => {

    if (process.argv.length < 4) {
        throw new Error(`bad arguments`);
    }

    const startMS = Date.now();

    const args = CLIUtil.extractFlags(process.argv.slice(3));

    const modules = args.cmds.map(m => resolve(process.cwd(), m));

    const name = args.flags.n ? args.flags.n : "all";

    const logger = console;

    const ret = await runTestModules(modules, typeof name === "string" && name.toLowerCase() === "all" ? undefined : name, console);

    const took = Date.now() - startMS;

    ret.failed.forEach(e => {
        logger.log("");
        logger.log("");
        logger.error("\x1b[31m%s\x1b[0m", e.fullName);
        logger.error(e.error);
        logger.log("");
        logger.log("");
    });

    logger.log("");
    logger.log("");
    logger.log(ret.passed + " tests pased");
    logger.log(ret.failed.length + " failed");
    logger.log("took " + took + "ms");
    logger.log("");
    logger.log("");

    process.exit(ret.failed.length > 0 ? 1 : 0);

}

