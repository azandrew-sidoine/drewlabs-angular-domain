import { GenericUndecoratedSerializaleSerializer } from "../../../built-value/core/js/serializer";
import {
  IHttpResourceResponse,
  IHttpResourceResponseBody,
  IHttpResponseData
} from "../../contracts/http-response";

export class HttpResourceResponse implements IHttpResourceResponse {
  success: boolean = undefined;
  body: IHttpResourceResponseBody = undefined;
  statusCode: number = undefined;

  // Static method definition for attribute parsing
  // tslint:disable-next-line: typedef
  static getJsonableProperties() {
    return {
      success: "success",
      body: { name: "body", type: HttpResourceResponseBody },
      code: "statusCode",
    } as
      | { [index: string]: keyof HttpResourceResponseBody }
      | { [index: string]: any };
  }
}

class HttpResourceResponseBody
  implements IHttpResourceResponseBody, IHttpResponseData
{
  errorMessage: string = undefined;
  responseData: IHttpResponseData = undefined;
  errors: any[] = undefined;

  // Static method definition for attribute parsing
  // tslint:disable-next-line: typedef
  static getJsonableProperties() {
    return {
      error_message: "errorMessage",
      response_data: { name: "responseData" },
      errors: "errors",
    } as
      | { [index: string]: keyof HttpResourceResponseBody }
      | { [index: string]: any };
  }
  getData = () => this.responseData;
}

// tslint:disable-next-line: typedef
export function parseV2HttpResponse(response: any) {
  const httpResponse =
    new GenericUndecoratedSerializaleSerializer<HttpResourceResponse>().fromSerialized(
      HttpResourceResponse,
      response
    );
  return {
    errorMessage: httpResponse.body
      ? httpResponse.body.errorMessage || null
      : null,
    statusCode: httpResponse.statusCode || null,
    data: (httpResponse.body as HttpResourceResponseBody).getData(),
    errors: httpResponse.body.errors || null,
  };
}
