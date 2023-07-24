import { getJSObjectPropertyValue } from './types/type-utils';
import { environment } from 'src/environments/environment';

/**
 * @description Generate a storage key by prefixing the provided key with the application unique key
 * @param value [[string]]
 */
export const storageEntry = (value: string, secret?: string): string => {
  return `${secret ? secret : 'APP_SECRET_BY_SEDANA_DREW'}_${value}`;
};

/**
 * @description Generate a unique big integer as filename
 */
export const randomfilename = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * @description Helper function for loading values from the application environment configurations
 * For embemded properties uses a dot seperated notation
 * ```typescript
 * const variable = getEnv('user.username');
 * or
 * const variable = getEnv('user');
 * ```
 * @param key Property of the environment to be loaded
 */
export const getEnv = (key: string) => {
  return getJSObjectPropertyValue(environment, key);
};

export { Dialog, WindowRef, readFileAsDataURI, b64toBlob, Browser } from './browser';
export { MomentUtils, Month, MonthProvider, MONTHS } from './datetime';

// JS Types helper functions
export {
  equals,
  isDefined,
  isNumber,
  isObject,
  isArray,
  isPrimitive,
  getJSObjectPropertyValue,
  check,
  ArrayUtils,
  Filtrable
} from './types';

// Enumeration values that can globally be used
export { Order } from './enums';

// URL Utilities functions
export { URLUtils } from './url/url';

// Numbers formatters implementations
export { AmountFormatter } from './formatters';
