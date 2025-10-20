import { isFunction } from 'lodash-es';

let plug!: Promise<void>;
let unclog: (value?: any) => void;

const init = () => {
  if (isFunction(unclog)) {
    unclog();
  }

  plug = new Promise((r) => {
    unclog = r;
  });
};

export { plug, init };
