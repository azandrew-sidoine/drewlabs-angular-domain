import { createSubject, observableOf } from "../helpers";
import { isObservable, Observable } from "rxjs";
import {
  scan,
  filter,
  delay,
  first,
  startWith,
  concatMap,
  tap,
  takeUntil,
} from "rxjs/operators";

export interface StoreAction {
  type: string;
  payload?: any;
}

export enum DefaultStoreAction {
  ASYNC_UI_ACTION = "[ASYNC_REQUEST]",
  ERROR_ACTION = "[REQUEST_ERROR]",
  INITIALIZE_STORE_STATE = "[RESET_STORE_STATE]",
}

export type StateReducerFn<T, A> = (state: T | any, action: A) => T;

export type ActionCreatorHandlerFn<A> = (...params: any[]) => A;

export type ActionCreatorFn<A extends Partial<StoreAction>, K> = (
  handlerFunc: (...params: K[]) => A
) => A;

const instanceOfInjectableStore = (value: any) => "getInjectedStore" in value;

export interface IInjectableStore<T, A extends Partial<StoreAction>> {
  state$: Observable<T>;

  /**
   * @description Returns the inner flux store object
   */
  getInjectedStore(): DrewlabsFluxStore<T, A>;
}

export abstract class InjectableStore<T, A extends Partial<StoreAction>>
  implements IInjectableStore<T, A>
{
  get state$(): Observable<T> {
    return this.getInjectedStore().connect();
  }

  abstract getInjectedStore(): DrewlabsFluxStore<T, A>;
}

export class DrewlabsFluxStore<T, AType extends Partial<StoreAction>> {
  private _destroy$ = createSubject<void>();

  private readonly _store$ = createSubject<T>();

  // tslint:disable-next-line: variable-name
  state$: Observable<T> = this._store$.asObservable();

  // tslint:disable-next-line: variable-name
  private _actions$ = createSubject<AType | Observable<AType>>();

  /**
   * @description EntityState instance initializer
   */
  constructor(reducer: StateReducerFn<T, AType>, initial: T) {
    this.subscribeToActions(reducer, initial);
  }

  // @internal
  private subscribeToActions = (
    reducer: StateReducerFn<T, AType>,
    initial: T
  ) => {
    this._actions$
      .pipe(
        takeUntil(this._destroy$),
        concatMap((action) =>
          isObservable(action)
            ? (action as Observable<AType>)
            : (observableOf<AType>(action) as Observable<AType>)
        ),
        filter((state) => typeof state !== "undefined" && state !== null),

        startWith(initial as any),
        scan(reducer),
        tap((state) => this._store$.next(state as any))
      )
      .subscribe();
  };

  public bindActionCreator =
    <K>(handler: ActionCreatorHandlerFn<AType>) =>
    (...args: any) => {
      const action = handler.call(null, ...args) as AType;
      this._actions$.next(action);
      if (isObservable(action.payload)) {
        // Simulate a wait before calling the next method
        action.payload
          .pipe(
            first(),
            delay(10),
            tap((state: any) => {
              this._actions$.next(state);
            })
          )
          .subscribe();
      }
      return action;
    };

  /**
   * @description Connect to the store data stream
   */
  connect = () => this.state$;

  /**
   * Provides a destruction mechanism to the store
   *
   * @returns
   */
  destroy = () =>
    (() => {
      this._store$.complete();
      this._destroy$.next();
    })();
}

// tslint:disable-next-line: typedef
export function createAction<T, A, K>(
  rxStore: DrewlabsFluxStore<T, A> | IInjectableStore<T, A>,
  actionCreator: ActionCreatorHandlerFn<A>
) {
  if (instanceOfInjectableStore(rxStore)) {
    return (rxStore as IInjectableStore<T, A>)
      .getInjectedStore()
      .bindActionCreator<K>(actionCreator);
  }
  return (rxStore as DrewlabsFluxStore<T, A>).bindActionCreator<K>(
    actionCreator
  );
}

export const createStore = <T, K>(
  reducer: StateReducerFn<T, K>,
  initialState: T
) => {
  return new DrewlabsFluxStore(reducer, initialState);
};

export const onErrorAction = <T, A>(store: DrewlabsFluxStore<T, Partial<A>>) =>
  createAction(
    store,
    (payload: any) =>
      ({ type: DefaultStoreAction.ERROR_ACTION, payload } as any)
  );

export const onInitStoreStateAction = <T, A>(
  store: DrewlabsFluxStore<T, Partial<A>>
) =>
  createAction(
    store,
    (payload: T = {} as T) =>
      ({ type: DefaultStoreAction.INITIALIZE_STORE_STATE, payload } as any)
  );

export const asyncUIAction = <T, A>(store: DrewlabsFluxStore<T, Partial<A>>) =>
  createAction(
    store,
    (payload: T = {} as T) =>
      ({ type: DefaultStoreAction.ASYNC_UI_ACTION, payload } as any)
  );
