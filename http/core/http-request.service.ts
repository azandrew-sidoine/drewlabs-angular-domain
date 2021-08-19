import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpProgressEvent
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, startWith } from 'rxjs/operators';
import { Injectable, Inject } from '@angular/core';
import { IHttpService } from '../contracts';
import { URLUtils } from '../../utils/url/url';
import { Browser } from '../../utils/browser/browser';
import { isDefined } from '../../utils/types/type-utils';
import { createSubject } from '../../rxjs/helpers/index';
import { Err } from '../../utils/logger';


/**
 * Derives file name from the http response by looking inside content-disposition
 * @param res http Response
 */
function fileNameFromResponseHeaders(res: any): string {
  if (res instanceof Blob) {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  const contentDisposition = res.headers.get('Content-Disposition') || '';
  const matches = /filename=([^;]+)/gi.exec(contentDisposition);
  const fileName = (matches[1] || 'untitled').trim();
  return fileName;
}

export interface HTTPErrorState {
  status: number;
  error?: any;
  url?: string;
}

@Injectable()
export class HttpRequestService implements IHttpService {

  // tslint:disable-next-line: variable-name
  private _errorState$ = createSubject<HTTPErrorState>();
  errorState$ = this._errorState$.pipe(
    startWith({} as HTTPErrorState)
  );

  private _progressEventState$ = createSubject<{event: HttpProgressEvent, path?: string}>();
  progressEventState = this._progressEventState$.pipe(
    startWith({event: null, path: ''} as {event: HttpProgressEvent, path?: string})
  );

  constructor(
    public http: HttpClient,
    @Inject('SERVER_URL') private serverUrl: string
  ) { }

  /**
   * {@inheritdoc}
   */
  post(
    path: string,
    body: any,
    options?: any
  ): Observable<any> {
    const url = URLUtils.isWebURL(path) ? `${path}` : `${this.serverUrl}${path}`;
    return this.http.post(url, body, options).pipe(
      // retry(1),
      catchError((err) => this.handleError(err))
    );
  }

  /**
   * {@inheritdoc}
   */
  get(
    path: string,
    options?: any
  ): Observable<any> {
    const url = URLUtils.isWebURL(path) ? `${path}` : `${this.serverUrl}${path}`;
    return this.http.get(url, options).pipe(
      // retry(1),
      catchError((err) => this.handleError(err))
    );
  }

  /**
   * {@inheritdoc}
   */
  put(
    path: string,
    body: any,
    options?: any
  ): Observable<any> {
    const url = URLUtils.isWebURL(path) ? `${path}` : `${this.serverUrl}${path}`;
    return this.http.put(url, body, options).pipe(
      // retry(1),
      catchError((err) => this.handleError(err))
    );
  }

  /**
   * {@inheritdoc}
   */
  delete(
    path: string,
    options?: any
  ): Observable<any> {
    const url = URLUtils.isWebURL(path) ? `${path}` : `${this.serverUrl}${path}`;
    return this.http.delete(url, options).pipe(
      // retry(1),
      catchError((err) => this.handleError(err))
    );
  }

  /**
   * {@inheritdoc}
   */
  handleError(error: HttpErrorResponse): Observable<never> {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      Err('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      this._errorState$.next({ status: +error.status, error: error.error, url: error.url });
      Err(`Backend returned code ${error.status}, ` + `body was: ${error.error}`);
    }
    // return an observable with a user friendly error message
    return throwError(error);
  }

  public defaultHttpHeaders(): HttpHeaders {
    const httpHeader = new HttpHeaders();
    httpHeader.append('Content-Type', 'application/json');
    return httpHeader;
  }

  /**
   * @description provide a file download functionnality to the application
   * @param url [[string]]
   */
  downloadFile(url: string, filename?: string, fileExtension?: string, params?: { [prop: string]: any }): Promise<any> {
    url = URLUtils.isWebURL(url) ? `${url}` : `${this.serverUrl}${url}`;
    // const headers = new HttpHeaders();
    // headers.append('Accept', 'text/plain');
    // headers.append('Content-type', 'application/octet-stream');
    return new Promise((_, __) => {
      this.loadServerFile(url, params)
        .then((res: any) => {
          if (!isDefined(filename)) {
            filename = isDefined(fileExtension) ? `${fileNameFromResponseHeaders(res)}.${fileExtension}` : `${fileNameFromResponseHeaders(res)}`;
          }
          Browser.saveFile(res, isDefined(fileExtension) ? `${filename}.${fileExtension}` : `${filename}`);
          _({});
        });
    });
  }

  /**
   * @description Load a file from the backend server
   * @param url [[string]]
   */
  loadServerFile(url: string, params?: { [prop: string]: any }): Promise<any> {
    const headers = new HttpHeaders();
    headers.append('Accept', 'text/plain');
    headers.append('Content-type', 'application/octet-stream');
    return new Promise((_, __) => {
      this.http
        .get(url, { headers, responseType: 'blob', params })
        .toPromise()
        .then((res: any) => {
          _(res);
        });
    });
  }

  noticeProgressEvent(event: HttpProgressEvent, path?: string) {
    this._progressEventState$.next({event, path});
  }
}
