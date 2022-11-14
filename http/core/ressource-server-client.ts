import { Observable } from 'rxjs';
import { IHttpResponse } from '../contracts/types';
import { HttpRequestService } from './http-request.service';
import { mapToHttpResponse } from '../../rxjs/operators/map-to-response-type';
import { IResourcesServerClient } from '../contracts/resource/ressource-server-client';
import { Injectable, Inject } from '@angular/core';
import { RequestBody, TransformResponseHandlerFn } from '../contracts/resource';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { doLog } from '../../rxjs/operators';
import { UIStateStatusCode } from '../../contracts/ui-state';
import { isBadRequest, isServerError } from './helpers';
import { map, tap } from 'rxjs/operators';
import * as saveAs from 'file-saver';

@Injectable()
export class DrewlabsRessourceServerClient implements IResourcesServerClient<IHttpResponse<any>> {

  constructor(
    private httpClient: HttpRequestService,
    @Inject('ResponseTransformHandlerFn') private responseTransformHandler: TransformResponseHandlerFn
  ) { }

  /**
   * {@inheritdoc}
   */
  // tslint:disable-next-line: typedef
  create(path: string, body: any, params?: object) {
    return this.httpClient.post(path, body, params)
      .pipe(

        doLog(`/POST ${path} - Request response: `),
        // mapToHttpResponse<IHttpResponse<any>>(this.responseTransformHandler.bind(null))
      ) as Observable<IHttpResponse<any>>;
  }

  createID(path: string, id: string | number, body: RequestBody, params?: object) {
    return this.httpClient.post(`${path}/${id}`, body, params)
      .pipe(
        doLog(`/POST ${path}/${id} - Request response: `),
        // mapToHttpResponse<IHttpResponse<any>>(this.responseTransformHandler.bind(null))
      ) as Observable<IHttpResponse<any>>;
  }

  getReference(path: string, body: any) {
    return this.httpClient.get(path, body)
      .pipe(

        doLog(`/GET ${path} - Request response: `),
        // mapToHttpResponse<IHttpResponse<any>>(this.responseTransformHandler.bind(null))
      ) as Observable<IHttpResponse<any>>;
  }

  /**
   * @inheritdoc
   */
  // tslint:disable-next-line: typedef
  get(path: string, params?: object) {
    return this.httpClient.get(path, params)
      .pipe(
        doLog(`/GET ${path} - Request response: `),
        mapToHttpResponse<IHttpResponse<any>>(this.responseTransformHandler.bind(null)),
      ) as Observable<IHttpResponse<any>>;
  }

  /**
   * {@inheritdoc}
   */
  // tslint:disable-next-line: typedef
  getUsingID(path: string, id: string | number, params?: object) {
    return this.httpClient.get(`${path}/${id}`, params)
      .pipe(
        doLog(`/GET ${path}/${id} - Request response: `),
        // mapToHttpResponse<IHttpResponse<any>>(this.responseTransformHandler.bind(null))
      ) as Observable<IHttpResponse<any>>;
  }

  downloadFile(path: string, id: string | number, params?: object) {

    const url = `${path}/${id}`;
    const headers = new HttpHeaders();
    headers.append('Accept', 'text/plain');
    headers.append('Content-type', 'application/octet-stream');
    const httpOptions = {
      responseType: 'blob'
    };
    return this.httpClient.get(url, httpOptions).pipe(map(response => {
      const blob = new Blob([response], { type: 'application/octet-stream' });
      saveAs(blob, 'test.pdf');
    }));
  }

  /**
   * {@inheritdoc}
   */
  // tslint:disable-next-line: typedef
  update(
    path: string, body: any, params?: object) {
    return this.httpClient.put(path, body, params)
      .pipe(
        doLog(`/PUT ${path} - Request response: `),
        // mapToHttpResponse<IHttpResponse<any>>(this.responseTransformHandler.bind(null))
      ) as Observable<IHttpResponse<any>>;
  }

  /**
   * {@inheritdoc}
   */
  // tslint:disable-next-line: typedef
  updateUsingID(
    path: string, id: string | number, body: RequestBody, params?: object) {
    return this.httpClient.put(`${path}/${id}`, body, params)
      .pipe(
        doLog(`/PUT ${path}/${id} - Request response: `),
        // mapToHttpResponse<IHttpResponse<any>>(this.responseTransformHandler.bind(null))
      ) as Observable<IHttpResponse<any>>;
  }

  /**
   * {@inheritdoc}
   */
  // tslint:disable-next-line: typedef
  delete(path: string, params: object) {
    return this.httpClient.delete(`${path}`, params)
      .pipe(
        doLog(`/DELETE ${path} - Request response: `),
        // mapToHttpResponse<IHttpResponse<any>>(this.responseTransformHandler.bind(null))
      ) as Observable<IHttpResponse<any>>;
  }

  /**
   * @inheritdoc
   */
  // tslint:disable-next-line: typedef
  deleteUsingID(path: string, id: string | number, params?: object) {
    return this.httpClient.delete(`${path}/${id}`, params)
      .pipe(
        doLog(`/DELETE ${path}/${id} - Request response: `),
        // mapToHttpResponse<IHttpResponse<any>>(this.responseTransformHandler.bind(null))
      ) as Observable<IHttpResponse<any>>;
  }

  /**
   * {@inheritdoc}
   */
  // tslint:disable-next-line: typedef
  handleErrorResponse(error: HttpErrorResponse): HttpErrorResponse | { status: UIStateStatusCode, validationErrors: { [prop: string]: any } } {
    const errorResponse = this.responseTransformHandler(error.error) as any;
    if (isBadRequest(error.status)) {
      const validationErrors: { [index: string]: any } = {};
      Object.keys(errorResponse.errors).forEach(
        (key) => {
          validationErrors[key] = errorResponse.errors[key][0];
        });
      return {
        status: UIStateStatusCode.BAD_REQUEST,
        validationErrors
      };
    }
    if (isServerError(error.status)) {
      return {
        status: UIStateStatusCode.ERROR,
        validationErrors: {}
      };
    }
    return error;
  }

  handleError(error: HttpErrorResponse) {
    return this.handleErrorResponse(error);
  }

}
