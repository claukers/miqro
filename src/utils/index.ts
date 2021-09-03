import cp from "child_process";

export const execSync = (cmd: string, options?: cp.ExecSyncOptionsWithBufferEncoding): void => {
  console.log(cmd);
  cp.execSync(
    cmd,
    options ? { stdio: 'inherit', ...options } : { stdio: 'inherit' }
  );
}
