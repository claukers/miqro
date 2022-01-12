export type Callback<T = any> = (...args: any[]) => T;

export interface FakeCallback<T = any> extends Callback<T> {
  callCount: number;
  callArgs: T[];
}

export const fake = (cb: Callback): FakeCallback => {
  const ret = (...args: any[]) => {
    ret.callCount++;
    ret.callArgs.push(args);
    return cb(...args);
  };
  ret.callCount = 0;
  ret.callArgs = [] as any;
  return ret;
}
