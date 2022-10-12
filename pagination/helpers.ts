import { Paginable } from '.';
import { JSArray, JSDate } from '../utils';
import { isArray } from '../utils/types/type-utils';
import {
  MapToPaginationQueryInputType,
  MapToPaginationQueryOutputType,
  PaginableValue,
  QueryFiltersType,
} from './types';

/**
 * Query operators supported
 */
const QUERY_OPERATORS = ['>=', '<=', '<', '>', '<>', '=like', '=='];

/**
 * Creates a date query parameter piping function that format the date value using the input format
 * into a date formatted as 'YYYY-MM-DD' supported by most backend services or databases
 *
 * @param format
 */
export function createDateQueryParamPipe(format: string = 'DD/MM/YYYY') {
  const toWebServiceDateFormat = (value: string) => {
    const newDate = JSDate.create(value as string, format);
    const result = JSDate.format(newDate, 'YYYY-MM-DD');
    return /(Invalid|DatenvalInvalid)/.test(result as string) ? value : result;
  };
  const parseQueryDate = (value: string) => {
    const _value = /[\w\/]{1,}(([ \t])?-([ \t])?)[\w\/]{1,}/.test(value) ? value.split('|') : value;
    if (Array.isArray(_value)) {
      const after = toWebServiceDateFormat(_value[0]);
      const before = toWebServiceDateFormat(_value[0]);
      return `>=:${after}|&&:<=:${before}`;
    }
    return toWebServiceDateFormat(_value as string);
  };
  const decoratedCallback: (
    key: string,
    value: unknown
  ) => [string, unknown] = (key: string, value: unknown) => {
    if (key && key.startsWith('date:')) {
      key = key.substring('date:'.length);
      const _value = Array.isArray(value) ? value[0] : (value as string);
      value = parseQueryDate(_value);
      return [key, value];
    }
    return [key, value] as [string, unknown];
  };
  return decoratedCallback;
}

/**
 * For query parameters composed of &&:, and:, etc... operators, we trim the operators
 * from the parameter which will be apply to the value of the parameter
 *
 * @param key
 */
function prepareComposedQueryKey(key: string): [string, string | undefined] {
  let prefix!: string | undefined;
  // First we remove any formatter from the query parameter name
  // before proceeding to trimming operators from the parameter name
  if (key.startsWith('date:')) {
    key = key.substring('date:'.length);
  }
  for (const operator of QUERY_OPERATORS) {
    if (key.startsWith(`&&:${operator}:`)) {
      prefix = `&&:${operator}:`;
      key = key.substring(`&&:${operator}:`.length);
      break;
    }
  }
  if (typeof prefix !== 'undefined' && prefix !== null) {
    return [key, prefix];
  }
  if (key.startsWith('&&:')) {
    key = key.substring('&&:'.length);
    prefix = '&&:';
  } else if (key.startsWith('and:')) {
    key = key.substring('and:'.length);
    prefix = 'and:';
  }
  return [key, prefix];
}

/**
 * Transformation function that takes in frameworks specific pagination
 * configuration and attempts to build a server query object.
 *
 * It was build taking into account Clarity datagrid paginator output during
 * refresh events
 *
 * @example
 * const state = mapPaginatorStateWith([{name: 'John', lastname: 'Doe'}])({
 *    page: {
 *      from: 1,
 *      to: 10,
 *      size: 15
 *    },
 *    filters: [
 *        { age: 15}
 *    ]
 * })
 */
export function mapToPaginationQuery<T = any>(
  filters: QueryFiltersType = [],
  filtersPipe?: (key: string, value: unknown) => [string, unknown]
) {
  return (state: Partial<MapToPaginationQueryInputType<T>>) => {
    let query: { [prop: string]: any } = {};
    if (state.filters) {
      for (const filter of state.filters) {
        let { property, value } = filter;
        let [key, result] = filtersPipe(property, value);
        const [_key, prefix] = prepareComposedQueryKey(key);
        query[_key] = [prefix ? `${prefix}${result}` : result];
      }
    }
    //#region Add sort filters to the list of query filters
    let order = 'DESC';
    let by = 'updated_at';
    if (state?.sort) {
      [by] =
        state?.sort?.by && typeof state?.sort?.by === 'string'
          ? prepareComposedQueryKey(state?.sort?.by as string)
          : ['updated_at'];
      order = state?.sort?.reverse ? 'DESC' : 'ASC';
    }
    query = {
      ...query,
      _query: JSON.stringify({
        orderBy: { order, by },
      }),
    };
    //#endregion Add sort filters to the list of query filters
    let queryState = {
      ...query,
      page: state?.page?.current ?? 1,
      per_page: state?.page?.size ?? 20,
    };
    if (isArray(filters)) {
      filters.map((p: object) => {
        queryState = { ...queryState, ...p };
      });
    }
    return queryState as MapToPaginationQueryOutputType;
  };
}

export const mapPaginableTo =
  <T extends PaginableValue>(payload: Partial<Paginable<T>>) =>
  (values: Paginable<T>) => {
    // tslint:disable-next-line: variable-name
    let _values = { ...values };
    // tslint:disable-next-line: variable-name
    const _items = _values.items || {};
    if (payload && payload.data) {
      (payload.data as T[]).forEach((value) => {
        const key = value.id.toString();
        if (_items[key]) {
          _items[key] = value;
        }
        _items[key] = value;
      });
      _values = {
        ..._values,
        data: JSArray.uniqBy(payload.data ?? _values.data, 'id'),
        total: payload.total || _values.total,
        items: _items,
        page: payload.page || _values.page,
        lastPage: payload.lastPage || _values.lastPage,
        nextPageURL:
          typeof payload.nextPageURL === 'object'
            ? payload.nextPageURL
            : payload.nextPageURL || _values.nextPageURL,
        lastPageURL: payload.lastPageURL || _values.lastPageURL,
      } as Paginable<T>;
    }
    return _values;
  };

export const addPaginableValue =
  <T extends PaginableValue>(payload: T[] | T) =>
  (values: Paginable<T>) => {
    // tslint:disable-next-line: variable-name
    let _values = values ? { ...values } : ({} as Paginable<T>);
    // tslint:disable-next-line: variable-name
    const _items = _values.items ?? {};
    if (payload) {
      const _payload = !isArray(payload) ? [payload as T] : (payload as T[]);
      _values = {
        ..._values,
        data: JSArray.uniqBy(
          _values.data ? [..._payload, ..._values.data] : [..._payload],
          'id'
        ),
        total: _values.total ? _values.total + 1 : 1,
        items: _payload.reduce((carry, current) => {
          if (current.id) {
            let _item: { [index: string]: any } = {};
            const _carry = carry ?? {};
            const key = current.id.toString();
            _item[key] = current;
            return { ..._carry, ..._item };
          }
          return { ...carry };
        }, _items),
      };
    }
    return _values;
  };

export const updatePaginableValue =
  <T extends PaginableValue>(payload: T) =>
  (values: Paginable<T>) => {
    // tslint:disable-next-line: variable-name
    let _values = values ? { ...values } : ({} as Paginable<T>);
    // tslint:disable-next-line: variable-name
    const _items = _values.items ?? {};
    if (payload) {
      const _payload = payload;
      _items[_payload.id.toString()] = _payload;
      _values = {
        ..._values,
        data: JSArray.uniqBy(
          [
            ...[_payload],
            ..._values.data?.filter((value) => value.id !== _payload.id),
          ],
          'id'
        ),
        items: _items,
      };
    }
    return _values;
  };

export const deletePaginableValue =
  <T extends PaginableValue>(payload: T) =>
  (values: Paginable<T>) => {
    // tslint:disable-next-line: variable-name
    let _values = values ? { ...values } : ({} as Paginable<T>);
    // tslint:disable-next-line: variable-name
    const _items = _values.items ?? {};
    if (payload) {
      delete _items[payload.id.toString()];
      _values = {
        ..._values,
        data: JSArray.uniqBy(
          [..._values.data?.filter((value) => value.id !== payload.id)],
          'id'
        ),
        items: _items,
      };
    }
    return _values;
  };

/**
 * @deprecated Use {@see mapToPaginationQuery} implementation
 * instead
 *
 * @example
 * const state = mapPaginatorStateWith([{name: 'John', lastname: 'Doe'}])({
 *    page: {
 *      from: 1,
 *      to: 10,
 *      size: 15
 *    },
 *    filters: [
 *        { age: 15}
 *    ]
 * })
 */
export const mapPaginatorStateWith = mapToPaginationQuery;
