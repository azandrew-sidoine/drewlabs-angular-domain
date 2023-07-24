import {
  Observable,
  Subject,
  Subscriber,
  TeardownLogic,
  BehaviorSubject,
} from "rxjs";

// Creates a new observable subject
export type GenericCreateSubjectFunc<T> = (
  param?: T
) => Subject<T> | BehaviorSubject<T>;
/**
 * @description Type definition for parameter passed to createObservable function
 */
export type GenericObserverHandlerFunc<T> = (
  subscriber: Subscriber<T>
) => TeardownLogic;

/**
 * @description Create observable type definition
 */
export type GenericCreateObservableFunc<T> = (
  handler?: GenericObserverHandlerFunc<T>
) => Observable<T>;

/**
 * @description Type definition for method mapping any response type to the IHttpReponse
 */
export type MapToHandlerResponse<T> = (res: any) => HandlerResult<T>;

export type mapToHttpResponseFunc<T> = (
  handlerFn: MapToHandlerResponse<T>
) => (source$: Observable<any>) => Observable<HandlerResult<T>>;

/**
 * @description Type definition for result of a given handler function
 */
export interface HandlerResult<T> {
  data: T;
}

export type PaginationDataState<T> = {
  items: { [index: string]: T };
  total: number;
  data: T[];
  lastPage?: number;
  nextPageURL?: string;
  lastPageURL?: string;
  currentPage?: number;
};
