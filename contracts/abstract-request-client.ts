import {
  ResponseBody,
  ResponseData
} from 'src/app/lib/domain/http/contracts/http-response-data';
import { HttpRequestService } from 'src/app/lib/domain/http/core';
import { ServerResponseKeys } from 'src/app/lib/domain/auth/core';
import { ISerializableBuilder } from '../built-value/contracts/serializers';
import { isDefined, isArray } from '../utils/type-utils';
import { IResponseBody } from '../http/contracts/http-response-data';
import { IAppStorage } from '../storage/contracts/store-interface';
import { Store } from '../store';
import { IPayload } from '../store/abstract-reducer';

/**
 * @description Make a get request to ressources server using the id parameter
 * @param id [[string|number]]
 */
export function loadThroughHttpRequest(client: HttpRequestService, ressourcesPath: string, id: string | number = null): Promise<any> {
  const provider = new RequestClient();
  return new Promise((resolve, reject) => {
    provider.get(client, isDefined(id) ? `${ressourcesPath}/${id}` : `${ressourcesPath}`)
      .then((res: ResponseData) => {
        const body: IResponseBody = new ResponseBody(
          Object.assign(res.body, { status: res.code })
        );
        if (res.success === true && isDefined(body.data)) {
          resolve(body.data);
        }
        resolve(null);
      })
      .catch(err => reject(err));
  });
}

/**
 * @description Try loading a model details from the cache or from the server
 * @param cache [[IAppStorage]]
 * @param client [[HttpRequestService]]
 * @param ressourcesPath [[string]]
 * @param id [[number|string]]
 * @param cacheEntriesKey [[string]]
 * @param builder [[ISerializableBuilder<T>]]
 */
export async function loadRessourceFromCacheOrGetFromServer<T extends any>(
  cache: IAppStorage,
  client: HttpRequestService,
  ressourcesPath: string,
  id: number | string,
  cacheEntriesKey: string,
  builder: ISerializableBuilder<T>) {
  // Try getting the form from the cache
  let forms = cache.get(cacheEntriesKey);
  return new Promise<T>((resolve, reject) => {
    // If the form is in the cache, generate the Form object from cache serialized value
    forms = (forms as Array<any>).map((value) => {
      return (builder).fromSerialized(value);
    });
    const form = (forms as T[]).find((value) => {
      return value.id === id;
    });
    if (form) {
      resolve(form);
    } else {
      // Else query for the form from an http endpoint
      const result: Promise<any> = loadThroughHttpRequest(client, ressourcesPath, id);
      result.then((value: any) => {
        if (isDefined(value)) {
          // Add the loaded form from to the session storage
          resolve(builder.fromSerialized(value));
        } else {
          resolve(null);
        }
      });
      result.catch((err) => reject(err));
    }
  });
}

/**
 * @description Get a list a ressources from the backend server using an HTTP request and notify ressources store
 * @param client [[HttpRequestService]]
 * @param ressourcesPath [[string]]
 * @param ressourceBuilder [[ISerializableBuilder<T>]]
 * @param store [[Store<T>]]
 * @param action [[string]]
 */
export function getRessourcesAndNotify<T>(
  client: HttpRequestService,
  ressourcesPath: string,
  ressourceBuilder: ISerializableBuilder<T>,
  store?: Store<T>,
  action?: string,
  dataKey?: string,
): Promise<T> {
  return new Promise<T>(async (_, __) => {
    const result = await loadThroughHttpRequest(client, ressourcesPath);
    if (isDefined(result) && isArray(result[dataKey].data) && isDefined(store)) {
      store.dispatch({
        type: action,
        payload: {
          value: (result[dataKey].data as Array<object>).map((value) => {
            return ressourceBuilder.fromSerialized(value);
          })
        }
      });
    }
    _();
  });
}

/**
 * @description Make an HTTP request for creating a new ressource and notify ressource store when completed successfully
 * @param client [[HttpRequestService]]
 * @param ressourcesPath [[string]]
 * @param requestBody [[object]]
 * @param ressourceBuilder [[ISerializableBuilder<T>]]
 * @param store [[Store<T>]]
 * @param action [[string]]
 */
export function postRessourceAndNotifiStore<T>(
  client: HttpRequestService,
  ressourcesPath: string,
  requestBody: object,
  ressourceBuilder?: ISerializableBuilder<T>,
  store?: Store<T>,
  action?: string
) {
  return new Promise<IResponseBody | T>((resolve, reject) => {
    (new RequestClient()).create(client, `${ressourcesPath}`, requestBody)
      .then((res: ResponseData) => {
        const body: IResponseBody = new ResponseBody(
          Object.assign(res.body, { status: res.code })
        );
        if ((res.success === true) && isDefined(body.data)) {
          if (isDefined(store) && isDefined(action)) {
            const ressource = ressourceBuilder.fromSerialized(body.data);
            store.dispatch({
              type: action,
              payload: {
                value: ressource
              }
            });
            resolve(ressource);
            return;
          }
        }
        resolve(body);
      })
      .catch(_ => reject(_));
  });
}

/**
 * @description Make an HTTP request with the PUT Verb and notify the ressource store when completed successfully or reject if an error
 * @param client [[HttpRequestService]]
 * @param ressourcesPath [[string]]
 * @param id  [[number|string]]
 * @param requestBody [[object]]
 * @param storeUpdateObject [[object|T]]
 * @param store [[Store<T>]]
 * @param action [[string]]
 * @param indexKey [[string]]
 */
export function putRessourceAndNotifyStore<T>(
  client: HttpRequestService,
  ressourcesPath: string,
  id: number | string,
  requestBody: object,
  storeUpdateObject: T | object,
  store?: Store<T>,
  action?: string,
  indexKey?: string,
) {
  return new Promise<IResponseBody>((resolve, reject) => {
    (new RequestClient()).update(client, `${ressourcesPath}`, id, requestBody)
      .then((res: ResponseData) => {
        const body: IResponseBody = new ResponseBody(
          Object.assign(res.body, { status: res.code })
        );
        if (res.success === true && isDefined(body.data) && body.data !== 0) {
          if (isDefined(store) && isDefined(action) && isDefined(indexKey)) {
            store.dispatch({
              type: action,
              payload: {
                index: indexKey,
                needle: id,
                value: storeUpdateObject
              } as IPayload
            });
          }
        }
        resolve(body);
      })
      .catch(err => reject(err));
  });
}

/**
 *
 * @description Send an HTTP POST and notify the ressource store when completed successfully or reject if an error
 * @param client [[HttpRequestService]]
 * @param ressourcesPath [[string]]
 * @param id  [[number|string]]
 * @param store [[Store<T>]]
 * @param action [[string]]
 * @param indexKey [[string]]
 */
export function deleteRessourceAndNotifyStore<T>(
  client: HttpRequestService,
  ressourcesPath: string,
  id: number | string,
  store?: Store<T>,
  action?: string,
  indexKey?: string
): Promise<IResponseBody> {
  return new Promise((resolve, reject) => {
    (new RequestClient()).delete(client, `${ressourcesPath}`, id)
      .then((res: ResponseData) => {
        const body: IResponseBody = new ResponseBody(
          Object.assign(res.body, { status: res.code })
        );
        // tslint:disable-next-line: max-line-length
        if (res.success === true && isDefined(body.data) && (body.data !== 0) && isDefined(store) && isDefined(action) && isDefined(indexKey)) {
          store.dispatch({
            type: action,
            payload: {
              index: indexKey,
              needle: id
            } as IPayload
          });
        }
        resolve(body);
      })
      .catch(err => reject(err));
  });
}

/**
 * @description Get a list a ressources from the backend server using an HTTP request
 * @param client [[HttpRequestService]]
 * @param ressourcesPath [[string]]
 * @param ressourceBuilder [[ISerializableBuilder<T>]]
 */
export function getRessources<T>(
  client: HttpRequestService,
  ressourcesPath: string,
  ressourceBuilder: ISerializableBuilder<T>,
  dataKey?: string
) {
  return new Promise<T[]>(async (_, __) => {
    const result = await loadThroughHttpRequest(client, ressourcesPath);
    const responseData = isDefined(dataKey) ? result[dataKey] : result;
    if (isDefined(responseData.data) && isArray(responseData.data)) {
      _((responseData.data as Array<object>).map((value) => {
        return ressourceBuilder.fromSerialized(value);
      }));
    }
    _([]);
  });
}

/**
 * @description Get and item from the data storage base on query conditions
 * @param client [[HttpRequestService]]
 * @param ressourcesPath [[string]]
 * @param ressourceBuilder [[ISerializableBuilder<T>]]
 */
export function getRessource<T>(
  client: HttpRequestService,
  ressourcesPath: string,
  ressourceBuilder: ISerializableBuilder<T>,
) {
  return new Promise<T>(async (_, __) => {
    const result = await loadThroughHttpRequest(client, ressourcesPath);
    if (isDefined(result)) {
      _(ressourceBuilder.fromSerialized(result));
      return;
    }
    _(null);
  });
}

/**
 * @description  Make an Http Request for creating many ressource items
 * @param client [[HttpRequestService]]
 * @param ressourcesPath [[string]]
 * @param requestBody [[object]]
 */
export function postManyRessources(
  client: HttpRequestService,
  ressourcesPath: string,
  requestBody: object[] | object,
) {
  return new Promise<IResponseBody>((resolve, reject) => {
    (new RequestClient()).create(client, `${ressourcesPath}`, requestBody)
      .then((res: ResponseData) => {
        const body: IResponseBody = new ResponseBody(
          Object.assign(res.body, { status: res.code })
        );
        resolve(body);
      })
      .catch(_ => reject(_));
  });
}

/**
 * @description Make an HTTP request for creating a new ressource
 * @param client [[HttpRequestService]]
 * @param ressourcesPath [[string]]
 * @param requestBody [[object]]
 * @param ressourceBuilder [[ISerializableBuilder<T>]]
 */
export function postRessource<T>(
  client: HttpRequestService,
  ressourcesPath: string,
  requestBody: object,
  ressourceBuilder?: ISerializableBuilder<T>,
) {
  return new Promise<IResponseBody | T>((resolve, reject) => {
    (new RequestClient()).create(client, `${ressourcesPath}`, requestBody)
      .then((res: ResponseData) => {
        const body: IResponseBody = new ResponseBody(
          Object.assign(res.body, { status: res.code })
        );
        if ((res.success === true) && isDefined(body.data) && isDefined(ressourceBuilder)) {
          resolve(ressourceBuilder.fromSerialized(body.data));
          return;
        }
        resolve(body);
      })
      .catch(_ => reject(_));
  });
}

/**
 * @description Make an HTTP PUT request to the ressources endpoint to update ressources information in the database
 * @param client [[HttpRequestService]]
 * @param ressourcesPath [[string]]
 * @param id  [[number|string]]
 * @param requestBody [[object]]
 */
export function putRessource<T>(
  client: HttpRequestService,
  ressourcesPath: string,
  id: number | string,
  requestBody: object
) {
  return new Promise<IResponseBody>((resolve, reject) => {
    (new RequestClient()).update(client, `${ressourcesPath}`, id, requestBody)
      .then((res: ResponseData) => {
        const body: IResponseBody = new ResponseBody(
          Object.assign(res.body, { status: res.code })
        );
        resolve(body);
      })
      .catch(err => reject(err));
  });
}

/**
 *
 * @description Make an HTTP DELETE Request to the ressources endpoint to remove the ressources from the storage
 * @param client [[HttpRequestService]]
 * @param ressourcesPath [[string]]
 * @param id  [[number|string]]
 */
export function deleteRessource<T>(
  client: HttpRequestService,
  ressourcesPath: string,
  id: number | string
): Promise<IResponseBody> {
  return new Promise((resolve, reject) => {
    (new RequestClient()).delete(client, `${ressourcesPath}`, id)
      .then((res: ResponseData) => {
        const body: IResponseBody = new ResponseBody(
          Object.assign(res.body, { status: res.code })
        );
        resolve(body);
      })
      .catch(err => reject(err));
  });
}

/**
 * @description Get ressources/ request handler
 * @param ressourcePath [[string]]
 * @param options [[object?]]
 */
export type HttpGetAllRequestFn = (
  client: HttpRequestService, ressourcePath: string, options?: object
) => Promise<ResponseData>;

/**
 * @description GET ressources/{id} request handler
 * @param ressources Server ressource path
 * @param id Ressource identifier
 * @param options [[object?]]
 */
export type HttpGetRequestFn = (
  client: HttpRequestService, ressourcePath: string, id: number | any, options?: object
) => Promise<ResponseData>;

/**
 * @desciption POST ressources/ request handler
 * @param ressources Server ressource path
 * @param requestBody Request body as jsonInput
 * @param options [[object?]]
 */
export type HttpPostRequestFn = (
  client: HttpRequestService, ressources: string, requestBody: object | any, options?: object
) => Promise<ResponseData>;

/**
 * DELETE ressources/{id} request handler
 * @param ressources Server ressource path
 * @param id Ressource identifier
 * @param options [[object?]]
 */
export type HttpDeleteRequestFn = (
  client: HttpRequestService, ressources: string, id: number | any, options?: object
) => Promise<ResponseData>;

/**
 * PUT ressources/{id} request handler
 * @param ressources Server ressource path
 * @param id contact identifier
 * @param options [[object?]]
 */
// tslint:disable-next-line: max-line-length
export type HttpPutRequestFn = (
  client: HttpRequestService, ressources: string, id: number | any, values: object | any, options?: object
) => Promise<ResponseData>;

export interface IRequestClient {

  /**
   * @description Send and HTTP Request to an external ressources server using [[GET]] verb
   */
  get: HttpGetAllRequestFn;

  /**
   * @description Send and HTTP Request to an external ressources server using [[GET]] verb and passing the ressources identifier
   */
  getById: HttpGetRequestFn;

  /**
   * @description Send and HTTP Request to an external ressources server using [[POST]] verb
   */
  create: HttpPostRequestFn;

  /**
   * @description Send and HTTP Request to an external ressources server using [[DELETE]] verb
   */
  delete: HttpDeleteRequestFn;

  /**
   * @description Send and HTTP Request to an external ressources server using [[PUT]] verb
   */
  update: HttpPutRequestFn;
}

export class RequestClient implements IRequestClient {

  public get: HttpGetAllRequestFn = (
    client: HttpRequestService, ressources: string, options?: object
  ) => {
    return new Promise<ResponseData>((resolve, reject) => {
      client.get(ressources, options).subscribe(
        res => {
          // Handle the response object
          const responseData: ResponseData =
            res[ServerResponseKeys.RESPONSE_DATA];
          resolve(responseData);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  public getById: HttpGetRequestFn = (
    client: HttpRequestService, ressources: string, id: any, options?: object
  ) => {
    return new Promise<ResponseData>((resolve, reject) => {
      client.get(`${ressources}/${id}`, options).subscribe(
        res => {
          // Handle the response object
          const responseData: ResponseData =
            res[ServerResponseKeys.RESPONSE_DATA];
          resolve(responseData);
        },
        err => {
          reject(err);
        }
      );
    });
  }
  public create: HttpPostRequestFn = (
    client: HttpRequestService, ressources: string, requestBody: object | string, options?: object
  ) => {
    return new Promise<ResponseData>((resolve, reject) => {
      client.post(ressources, requestBody, options).subscribe(
        res => {
          // Handle the response object
          const responseData: ResponseData =
            res[ServerResponseKeys.RESPONSE_DATA];
          resolve(responseData);
        },
        err => {
          reject(err);
        }
      );
    });
  }
  public delete: HttpDeleteRequestFn = (
    client: HttpRequestService, ressources: string, id: any, options?: object
  ) => {
    return new Promise<ResponseData>((resolve, reject) => {
      client.delete(`${ressources}/${id}`, options).subscribe(
        res => {
          // Handle the response object
          const responseData: ResponseData =
            res[ServerResponseKeys.RESPONSE_DATA];
          resolve(responseData);
        },
        err => {
          reject(err);
        }
      );
    });
  }
  public update: HttpPutRequestFn = (
    client: HttpRequestService, ressources: string, id?: any, updateValues = {}, options?: object
  ) => {
    return new Promise<ResponseData>((resolve, reject) => {
      ressources = id ? `${ressources}/${id}` : `${ressources}`;
      client.put(ressources, updateValues, options).subscribe(
        res => {
          // Handle the response object
          const responseData: ResponseData =
            res[ServerResponseKeys.RESPONSE_DATA];
          resolve(responseData);
        },
        err => {
          reject(err);
        }
      );
    });
  }
}
