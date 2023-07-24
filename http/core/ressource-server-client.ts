import { Observable } from 'rxjs';
import { IHttpResponse } from '../contracts/types';
import { HttpRequestService } from './http-request.service';
import { mapToHttpResponse } from '../../rxjs/operators/map-to-response-type';
import { IResourcesServerClient } from '../contracts/resource/ressource-server-client';
import { Injectable, Inject } from '@angular/core';
import { RequestBody, TransformResponseHandlerFn } from '../contracts/resource';
import { HttpErrorResponse} from '@angular/common/http';
import { DrewlabsHttpResponseStatusCode } from './http-response';
import { UIStateStatusCode } from '../../helpers/app-ui-store-manager.service';
import { doLog } from '../../rxjs/operators';

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
        // tap(data => {
        //   if ((data as HttpProgressEvent)?.type === (HttpEventType.DownloadProgress || HttpEventType.UploadProgress)) {
        //     if (data != null) {
        //       this.httpClient.noticeProgressEvent(data, path);
        //     }
        //   }
        // }),
        // filter(data => data?.type  === HttpEventType.Response ),
        mapToHttpResponse<IHttpResponse<any>>(this.responseTransformHandler.bind(null))
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
        mapToHttpResponse<IHttpResponse<any>>(this.responseTransformHandler.bind(null))
      ) as Observable<IHttpResponse<any>>;
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
        mapToHttpResponse<IHttpResponse<any>>(this.responseTransformHandler.bind(null))
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
        mapToHttpResponse<IHttpResponse<any>>(this.responseTransformHandler.bind(null))
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
        mapToHttpResponse<IHttpResponse<any>>(this.responseTransformHandler.bind(null))
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
        mapToHttpResponse<IHttpResponse<any>>(this.responseTransformHandler.bind(null))
      ) as Observable<IHttpResponse<any>>;
  }

  /**
   * {@inheritdoc}
   */
  // tslint:disable-next-line: typedef
  handleErrorResponse(error: HttpErrorResponse) {
    const errorResponse = this.responseTransformHandler(error.error);
    if (error.status === DrewlabsHttpResponseStatusCode.BAD_REQUEST) {
      const validationErrors = {};
      Object.keys(errorResponse.errors).forEach(
        (key) => {
          validationErrors[key] = errorResponse.errors[key][0];
        });
      return {
        status: UIStateStatusCode.BAD_REQUEST,
        validationErrors
      };
    }
    if (error.status === DrewlabsHttpResponseStatusCode.SERVER_ERROR) {
      return {
        status: UIStateStatusCode.ERROR,
        validationErrors: null
      };
    }
    return error;
  }

}
