import { isDefined, isObject } from '../../utils/types/type-utils';
import { IHttpResponse } from '../contracts/types';
import { ErrorHandler } from '../contracts/error-handler';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpResponseStatusCode } from '../contracts';

/**
 * @description Utilities function for getting exact response data from an IHttpReponse data property
 * @param state [[IHttpResponse]]
 */
export const getResponseDataFromHttpResponse = (
  state: IHttpResponse<any> | any,
  innerKey = 'data'
) => {
  return isDefined(state.data) &&
    isObject(state.data) &&
    state.data.hasOwnProperty(innerKey)
    ? state.data[innerKey]
    : state.data;
};

/**
 * @description Utilities function for getting exact response data from an IHttpReponse data property
 * @param state [[IHttpResponse]]
 */
export const getResponseV2DataFromHttpResponse = (
  state: IHttpResponse<any>
) => {
  const { data } =
    isDefined(state.data) && isDefined(state.data.data) ? state.data : state;
  return data;
};

export const defaultHttpErrorHandler = (client: ErrorHandler, err: any) => {
  if (err instanceof HttpErrorResponse) {
    const errorResponse = client.handleError(err);
    return errorResponse;
  } else {
    return err;
  }
};

export function isServerErrorResponse(status: number) {
  return (
    Number(status) === Number(HttpResponseStatusCode.SERVER_ERROR) ||
    Number(status) === Number(HttpResponseStatusCode.UNKNOWN)
  );
}

/**
 * @description Checks if the request response status code equals HTTP OK status code
 * @param status Reponse status code
 */
export function responseStatusOK(status: number | string) {
  return Number(status) === Number(HttpResponseStatusCode.STATUS_OK);
}

/**
 *
 * @param status
 */
export function isServerBadRequest(status: number) {
  return Number(status) === Number(HttpResponseStatusCode.BAD_REQUEST);
}

export function isUnAuthorizedResponse(status: number) {
  return Number(status) === Number(HttpResponseStatusCode.UNAUTHORIZED);
}
