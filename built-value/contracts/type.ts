import { isDefined } from '../../utils/types/type-utils';

export interface TypeBuilder<T extends object> {
  /**
   * @description Interface definition for building an instance of T
   * @param bluePrint [[ new () => T]]
   * @param params [[object]]
   */
  build(bluePrint: new () => T, params: object): T;

  /**
   * @description Interface definitions for rebuilding an instance of T
   * @param instance [[T]]
   * @param params [[object]]
   */
  rebuild(instance: T, params: T | object): T;
}

/**
 * @description Build a javascript object from another object
 * @param bluePrint [[new () => T]]
 * @param params [[object]]
 */
export function buildJSObjectType<T extends any>(
  bluePrint: new () => T,
  params: { [index: string]: any }
): T {
  const obj = new bluePrint() as any;
  Object.keys(params).forEach((key) => {
    obj[key] = params[key];
  });
  return obj;
}

export function rebuildJSObjectType<T extends any>(
  instance: any,
  params: T | { [index: string]: any }
): T {
  if (!isDefined(instance)) {
    return instance;
  }
  Object.keys(params as { [index: string]: any }).forEach((key) => {
    if (
      instance.hasOwnProperty(key) &&
      isDefined((params as { [index: string]: any })[key])
    ) {
      instance[key] = (params as { [index: string]: any })[key];
    }
  });
  return instance;
}
