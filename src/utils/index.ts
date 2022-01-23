import { execSync as cpExec, ExecSyncOptionsWithBufferEncoding } from "child_process";

export const execSync = (cmd: string, options?: ExecSyncOptionsWithBufferEncoding): void => {
  console.log(cmd);
  cpExec(
    cmd,
    options ? { stdio: 'inherit', ...options } : { stdio: 'inherit' }
  );
}

export type Callback<T = any> = (...args: any[]) => T;

// noinspection SpellCheckingInspection
const routeCMDModule = async (cmdArg: string | undefined, cmds: { [key: string]: { cb: Callback<void> | Callback<Promise<void>>; description: string; section?: string; } }, logger: {
  error: (...args: any[]) => void;
} | Console, exit = true): Promise<void> => {
  if (!cmdArg) {
    throw new Error("no command");
  } else {
    if (!cmds[cmdArg]) {
      throw new Error("command " + cmdArg + " not found!");
    } else {
      try {
        await cmds[cmdArg].cb();
      } catch (e: any) {
        if (e && e.message) {
          logger.error(e);
        }
        if (exit) {
          process.exit(1);
        }
      }
    }
  }
}

export const extractFlags = (args: string[], options?: {
  flags: {
    [name: string]: {
      description?: string;
      hasValue?: boolean;
    }
  }
}): { flags: { [key: string]: string | (string | null)[] | null }; files: string[]; } => {
  const flags: { [key: string]: string | (string | null)[] | null } = {};
  const files: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.indexOf("-") === 0) {
      const argName = arg.substring(arg.indexOf("--") === 0 ? 2 : 1);
      const ignoreValue = options && options.flags && options.flags[argName] && options.flags[argName].hasValue === false ? true : false; 
      const argValue = !ignoreValue && args.length > i + 1 && args[i + 1] && args[i + 1].indexOf("-") != 0 ? args[i + 1] : null;
      const flag = flags[argName];
      if (flag instanceof Array) {
        flag.push(argValue);
      } else if (flag) {
        flags[argName] = [flag, argValue];
      } else {
        flags[argName] = argValue;
      }
      if (argValue !== null) {
        i++;
      }
    } else {
      files.push(arg);
    }
  }
  return { flags, files };
}

export const mainCMD = (cmds: { [key: string]: { cb: Callback<void> | Callback<Promise<void>>; description: string; section?: string; } }, usage: string, logger: {
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
} | Console, cmdArg = process.argv[2], exit = true): void => {
  const flow = async () => {
    try {
      await routeCMDModule(cmdArg, cmds, logger, exit);
    } catch (e: any) {
      if (e && e.message) {
        logger.error(e.message);
      }
      logger.info(`${usage}`);
      logger.info(`Available commands:`);
      for (const cmd of Object.keys(cmds)) {
        if (cmds[cmd].section) {
          logger.info(`\n${cmds[cmd].section}\n`);
        }
        logger.info(`\t${cmd}\t${cmds[cmd].description}`);
      }
      logger.info("");
      if (exit) {
        process.exit(1);
      }
    }
  }
  flow().catch((e) => {
    logger.error(e);
  });
}
