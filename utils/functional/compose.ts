export function compose<T, R extends any>(
  ...funcs: ((...params: any[]) => any)[]
) {
  return function (source: T): R {
    let carry = source as unknown as R;
    for (const func of funcs) {
      carry = func(carry);
    }
    return carry;
  };
}

export function reverseCompose<T>(...funcs: ((...params: any[]) => any)[]) {
  return (source: T) => {
    let carry = source;
    for (const func of funcs.reverse()) {
      carry = func(carry);
    }
    return carry;
  };
}
