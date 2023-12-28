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
    if (!cmds.hasOwnProperty(cmdArg)) {
      throw new Error("command " + cmdArg + " not found!");
    } else {
      try {
        await cmds[cmdArg].cb();
      } catch (e: any) {
        if (e && e.message) {
          logger.error("Error running command. " + e.message);
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
  const flags: { [key: string]: string | (string | null)[] | null } = Object.create(null);
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

const getTabs = (n?: number) => {
  n = n ? n : 1;
  let ret = "";
  for (let i = 0; i < n; i++) {
    ret += "\t";
  }
  return ret;
}

export function getUsage(cmds: CMDMap, usage: string) {
  let out = "";
  out += `${usage}`;
  out += `Available commands:\n\n`;
  for (const cmd of Object.keys(cmds)) {
    if (cmds[cmd].section) {
      out += `\n==${cmds[cmd].section}==\n\n`;
    }
    //const description = cmds[cmd].description.split("\n").map(s => `${getTabs(/*cmds[cmd].tabs*/2)}${s}`).join("\n");
    //const description = cmds[cmd].description.split("\n").map(s => `${getTabs(/*cmds[cmd].tabs*/1)}${s}`).join("\n");
    const description = cmds[cmd].description.split("\n").map(s => `${getTabs(cmds[cmd].tabs)}${s}`).join("\n");
    out += `${cmd}${description}\n`;
    //logger.info(`${cmd}\n${description}`);
  }
  out += "\n";
  return out;
}

interface CMDMap { [key: string]: { cb: Callback<void> | Callback<Promise<void>>; description: string; section?: string; tabs?: number } }

export const mainCMD = (cmds: CMDMap, usage: string, logger: {
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
      logger.info(getUsage(cmds, usage));
      if (exit) {
        process.exit(1);
      }
    }
  }
  flow().catch((e) => {
    logger.error(e);
  });
}
