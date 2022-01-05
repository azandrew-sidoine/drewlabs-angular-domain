import { HandlerResult } from '../../rxjs/types';

export interface IHttpResponse<T extends any>  extends HandlerResult<T> {
    statusCode: number;
    success?: boolean;
    statusMessage?: string;
    errors?: string[]|object;
    errorMessage?: string;
    data: T;
}


/**
 *  @description Returns the response data object contains in the http response
 * @param response [[IHttpResponse<T>]]
 */
export type getResultData<T> = (response: HandlerResult<T>) =>  T;

/**
 * @description Returns true if the HTTP request completed sucessfully
 * @param response [[IHttpResponse<any>]]
 */
export type statusOk = (response: number|string)  =>  boolean;


/**
 * @description Returns the HTTP response status code
 * @param response [[IHttpResponse<any>]]
 */
export type statusCode = (response: IHttpResponse<any>) => number;

/**
 * @description Returns the status message of the HTTP response
 * @param response [[IHttpResponse<any>]]
 */
export type statusMessage = (response: IHttpResponse<any>) => string;

/**
 * @description Type definition for method mapping any response type to the IHttpReponse
 */
export type MapToIHttpResponse<T> = (res: any) => IHttpResponse<T>;
