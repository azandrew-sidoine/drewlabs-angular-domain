import { isDefined } from "../../utils/types/type-utils";

export interface TypeBuilder<T> {
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
  params: object
): T {
  const obj = new bluePrint();
  Object.keys(params).forEach((key) => {
    if (obj.hasOwnProperty(key)) {
      obj[key] = params[key];
    }
  });
  return obj;
}

export function rebuildJSObjectType<T extends any>(
  instance: T,
  params: T | object
): T {
  if (!isDefined(instance)) {
    return;
  }
  Object.keys(params).forEach((key) => {
    if (instance.hasOwnProperty(key) && isDefined(params[key])) {
      instance[key] = params[key];
    }
  });
  return instance;
}

export type JSONSerializationRType<T> =
  | { [index: string]: keyof T }
  | { [index: string]: any };


export type FromSerializeCallbackType<T> = (serialized: { [index: string]: any }) => T;
