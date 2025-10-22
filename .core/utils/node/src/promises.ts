export const promiseResolver = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;
  const cleanup = () => {
    resolve = () => void 0;
    reject = () => void 0;
  };
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = (value) => {
      _resolve(value);
      cleanup();
    };
    reject = (reason) => {
      _reject(reason);
      cleanup();
    };
  });
  return [promise, resolve, reject] as [
    promise: typeof promise,
    resolve: typeof resolve,
    reject: typeof reject
  ];
};
