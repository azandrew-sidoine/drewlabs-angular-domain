import { ISerializableBuilder } from "../built-value/contracts/serializers";
import {
  IResponseBody,
  ResponseBody,
  ResponseData,
} from "../http/contracts/http-response-data";
import { IAppStorage } from "../storage/contracts/store-interface";
import { IEntityServiceProvider } from "./entity-service-provider";
import { isArray, isDefined } from "../utils";

/**
 * @description Make a get request to ressources server using the id parameter
 * @param id [[string|number]]
 */
export function loadThroughHttpRequest(
  client: IEntityServiceProvider,
  ressourcesPath: string,
  id?: string | number,
  params?: object
): Promise<any> {
  const provider = new RequestClient();
  return new Promise((resolve, reject) => {
    provider
      .get(
        client,
        isDefined(id) ? `${ressourcesPath}/${id}` : `${ressourcesPath}`,
        params
      )
      // tslint:disable-next-line: deprecation
      .then((res: ResponseData) => {
        // tslint:disable-next-line: deprecation
        const body: IResponseBody = new ResponseBody(
          Object.assign(res.body, { status: res.code })
        );
        if (res.success === true && isDefined(body.data)) {
          resolve(body.data);
          return;
        }
        resolve(null);
      })
      .catch((err) => reject(err));
  });
}

/**
 * @description Try loading a model details from the cache or from the server
 * @param cache [[IAppStorage]]
 * @param client [[IEntityServiceProvider]]
 * @param ressourcesPath [[string]]
 * @param id [[number|string]]
 * @param cacheEntriesKey [[string]]
 * @param builder [[ISerializableBuilder<T>]]
 */
export const loadRessourceFromCacheOrGetFromServer = async <T extends any>(
  cache: IAppStorage,
  client: IEntityServiceProvider,
  ressourcesPath: string,
  id: number | string,
  cacheEntriesKey: string,
  builder: ISerializableBuilder<T>
) => {
  // Try getting the form from the cache
  const forms = cache.get(cacheEntriesKey);
  return new Promise<T>(async (resolve, reject) => {
    // If the form is in the cache, generate the Form object from cache serialized value
    if (isDefined(forms) && isArray(forms)) {
      const form = (forms as any[]).find((value) => {
        return value.id === id;
      });
      if (form) {
        resolve(builder.fromSerialized(form));
      }
      return;
    }
    try {
      const result = await loadThroughHttpRequest(client, ressourcesPath, id);
      // Add the loaded form from to the session storage
      resolve(isDefined(result) ? builder.fromSerialized(result) : result);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * @description Get a list a ressources from the backend server using an HTTP request
 * @param client [[IEntityServiceProvider]]
 * @param ressourcesPath [[string]]
 * @param ressourceBuilder [[ISerializableBuilder<T>]]
 */
export const getRessources = <T>(
  client: IEntityServiceProvider,
  ressourcesPath: string,
  ressourceBuilder: ISerializableBuilder<T>,
  dataKey?: string,
  params?: object
) => {
  return new Promise<T[]>(async (_, __) => {
    const result = await loadThroughHttpRequest(
      client,
      ressourcesPath,
      null,
      params
    );
    const responseData = isDefined(dataKey) ? result[dataKey] : result;
    if (isDefined(responseData.data) && isArray(responseData.data)) {
      _(
        (responseData.data as Array<object>).map((value) => {
          return ressourceBuilder.fromSerialized(value);
        })
      );
    }
    _([]);
  });
};

/**
 * @description Get and item from the data storage base on query conditions
 * @param client [[IEntityServiceProvider]]
 * @param ressourcesPath [[string]]
 * @param ressourceBuilder [[ISerializableBuilder<T>]]
 */
export const getRessource = <T>(
  client: IEntityServiceProvider,
  ressourcesPath: string,
  ressourceBuilder: ISerializableBuilder<T>,
  params?: object
) => {
  return new Promise<T>(async (_, __) => {
    const result = await loadThroughHttpRequest(
      client,
      ressourcesPath,
      null,
      params
    );
    if (isDefined(result)) {
      _(ressourceBuilder.fromSerialized(result));
      return;
    }
    _(null);
  });
};

/**
 * @description  Make an Http Request for creating many ressource items
 * @param client [[IEntityServiceProvider]]
 * @param ressourcesPath [[string]]
 * @param requestBody [[object]]
 * @param params [[object]]
 */
export const postManyRessources = (
  client: IEntityServiceProvider,
  ressourcesPath: string,
  requestBody: object[] | object,
  params?: object
) => {
  // tslint:disable-next-line: deprecation
  return new Promise<IResponseBody>((resolve, reject) => {
    new RequestClient()
      .create(client, `${ressourcesPath}`, requestBody, params)
      // tslint:disable-next-line: deprecation
      .then((res: ResponseData) => {
        // tslint:disable-next-line: deprecation
        const body: IResponseBody = new ResponseBody(
          Object.assign(res.body, { status: res.code })
        );
        resolve(body);
      })
      .catch((_) => reject(_));
  });
};

/**
 * @description Make an HTTP request for creating a new ressource
 * @param client [[IEntityServiceProvider]]
 * @param ressourcesPath [[string]]
 * @param requestBody [[object]]
 * @param ressourceBuilder [[ISerializableBuilder<T>]]
 */
// tslint:disable-next-line: max-line-length
export const postRessource = <T>(
  client: IEntityServiceProvider,
  ressourcesPath: string,
  requestBody: object,
  ressourceBuilder?: ISerializableBuilder<T>,
  params?: object
) => {
  // tslint:disable-next-line: deprecation
  return new Promise<IResponseBody | T>((resolve, reject) => {
    new RequestClient()
      .create(client, `${ressourcesPath}`, requestBody, params)
      // tslint:disable-next-line: deprecation
      .then((res: ResponseData) => {
        // tslint:disable-next-line: deprecation
        const body: IResponseBody = new ResponseBody(
          Object.assign(res.body, { status: res.code })
        );
        if (
          res.success === true &&
          isDefined(body.data) &&
          isDefined(ressourceBuilder)
        ) {
          resolve(ressourceBuilder.fromSerialized(body.data));
          return;
        }
        resolve(body);
      })
      .catch((_) => reject(_));
  });
};

/**
 * @description Make an HTTP PUT request to the ressources endpoint to update ressources information in the database
 * @param client [[IEntityServiceProvider]]
 * @param ressourcesPath [[string]]
 * @param id  [[number|string]]
 * @param requestBody [[object]]
 * @param params [[object|null]]
 */
// tslint:disable-next-line: max-line-length
export const putRessource = <T>(
  client: IEntityServiceProvider,
  ressourcesPath: string,
  id: number | string,
  requestBody: object,
  params?: object
) => {
  // tslint:disable-next-line: deprecation
  return new Promise<IResponseBody>((resolve, reject) => {
    new RequestClient()
      .update(client, `${ressourcesPath}`, id, requestBody, params)
      // tslint:disable-next-line: deprecation
      .then((res: ResponseData) => {
        // tslint:disable-next-line: deprecation
        const body: IResponseBody = new ResponseBody(
          Object.assign(res.body, { status: res.code })
        );
        resolve(body);
      })
      .catch((err) => reject(err));
  });
};

/**
 *
 * @description Make an HTTP DELETE Request to the ressources endpoint to remove the ressources from the storage
 * @param client [[IEntityServiceProvider]]
 * @param ressourcesPath [[string]]
 * @param id  [[number|string]]
 */
// tslint:disable-next-line: max-line-length
export const deleteRessource = <T>(
  client: IEntityServiceProvider,
  ressourcesPath: string,
  id: number | string,
  // tslint:disable-next-line: deprecation
  params?: object
): Promise<IResponseBody> => {
  return new Promise((resolve, reject) => {
    new RequestClient()
      .delete(client, `${ressourcesPath}`, id, params)
      // tslint:disable-next-line: deprecation
      .then((res: ResponseData) => {
        // tslint:disable-next-line: deprecation
        const body: IResponseBody = new ResponseBody(
          Object.assign(res.body, { status: res.code })
        );
        resolve(body);
      })
      .catch((err) => reject(err));
  });
};

/**
 * @description Get ressources/ request handler
 * @param ressourcePath [[string]]
 * @param options [[object?]]
 */
export type HttpGetAllRequestFn = (
  client: IEntityServiceProvider,
  ressourcePath: string,
  options?: object
  // tslint:disable-next-line: deprecation
) => Promise<ResponseData>;

/**
 * @description GET ressources/{id} request handler
 * @param ressources Server ressource path
 * @param id Ressource identifier
 * @param options [[object?]]
 */
export type HttpGetRequestFn = (
  client: IEntityServiceProvider,
  ressourcePath: string,
  id: number | any,
  options?: object
  // tslint:disable-next-line: deprecation
) => Promise<ResponseData>;

/**
 * @desciption POST ressources/ request handler
 * @param ressources Server ressource path
 * @param requestBody Request body as jsonInput
 * @param options [[object?]]
 */
export type HttpPostRequestFn = (
  client: IEntityServiceProvider,
  ressources: string,
  requestBody: object | any,
  options?: object
  // tslint:disable-next-line: deprecation
) => Promise<ResponseData>;

/**
 * DELETE ressources/{id} request handler
 * @param ressources Server ressource path
 * @param id Ressource identifier
 * @param options [[object?]]
 */
export type HttpDeleteRequestFn = (
  client: IEntityServiceProvider,
  ressources: string,
  id: number | any,
  options?: object
  // tslint:disable-next-line: deprecation
) => Promise<ResponseData>;

/**
 * PUT ressources/{id} request handler
 * @param ressources Server ressource path
 * @param id contact identifier
 * @param options [[object?]]
 */
// tslint:disable-next-line: max-line-length
export type HttpPutRequestFn = (
  client: IEntityServiceProvider,
  ressources: string,
  id: number | any,
  values: object | any,
  options?: object
  // tslint:disable-next-line: deprecation
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
    client: IEntityServiceProvider,
    ressources: string,
    options?: object
  ) => {
    // tslint:disable-next-line: deprecation
    return new Promise<ResponseData>((resolve, reject) => {
      client.get(ressources, options).subscribe(
        (res) => {
          // Handle the response object
          // tslint:disable-next-line: deprecation
          const responseData: ResponseData = res["data"];
          resolve(responseData);
        },
        (err) => {
          reject(err);
        }
      );
    });
  };

  public getById: HttpGetRequestFn = (
    client: IEntityServiceProvider,
    ressources: string,
    id: any,
    options?: object
  ) => {
    // tslint:disable-next-line: deprecation
    return new Promise<ResponseData>((resolve, reject) => {
      client.get(`${ressources}/${id}`, options).subscribe(
        (res) => {
          // Handle the response object
          // tslint:disable-next-line: deprecation
          const responseData: ResponseData = res["data"];
          resolve(responseData);
        },
        (err) => {
          reject(err);
        }
      );
    });
  };
  public create: HttpPostRequestFn = (
    client: IEntityServiceProvider,
    ressources: string,
    requestBody: object | string,
    options?: object
  ) => {
    // tslint:disable-next-line: deprecation
    return new Promise<ResponseData>((resolve, reject) => {
      client.post(ressources, requestBody, options).subscribe(
        (res) => {
          // Handle the response object
          // tslint:disable-next-line: deprecation
          const responseData: ResponseData = res["data"];
          resolve(responseData);
        },
        (err) => {
          reject(err);
        }
      );
    });
  };
  public delete: HttpDeleteRequestFn = (
    client: IEntityServiceProvider,
    ressources: string,
    id: any,
    options?: object
  ) => {
    // tslint:disable-next-line: deprecation
    return new Promise<ResponseData>((resolve, reject) => {
      client.delete(`${ressources}/${id}`, options).subscribe(
        (res) => {
          // Handle the response object
          // tslint:disable-next-line: deprecation
          const responseData: ResponseData = res["data"];
          resolve(responseData);
        },
        (err) => {
          reject(err);
        }
      );
    });
  };
  public update: HttpPutRequestFn = (
    client: IEntityServiceProvider,
    ressources: string,
    id?: any,
    updateValues = {},
    options?: object
  ) => {
    // tslint:disable-next-line: deprecation
    return new Promise<ResponseData>((resolve, reject) => {
      ressources = id ? `${ressources}/${id}` : `${ressources}`;
      client.put(ressources, updateValues, options).subscribe(
        (res) => {
          // Handle the response object
          // tslint:disable-next-line: deprecation
          const responseData: ResponseData = res["data"];
          resolve(responseData);
        },
        (err) => {
          reject(err);
        }
      );
    });
  };
}
