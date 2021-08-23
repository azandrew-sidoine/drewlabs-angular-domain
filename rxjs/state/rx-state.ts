import { createSubject, observableOf } from '../helpers';
import { isObservable, Observable } from 'rxjs';
import { scan, shareReplay, filter, delay, first, startWith, concatMap } from 'rxjs/operators';
import { doLog } from '../operators/index';
import { isDefined } from '../../utils/types/type-utils';

export interface StoreAction {
  type: string;
  payload?: any;
}

export enum DefaultStoreAction {
  ASYNC_UI_ACTION = '[ASYNC_REQUEST]',
  ERROR_ACTION = '[REQUEST_ERROR]',
  INITIALIZE_STORE_STATE = '[RESET_STORE_STATE]'
}

export type StateReducerFn<T, A> = (state: T, action: A) => T;

export type ActionCreatorHandlerFn<A> = (...params: any[]) => A;

export type ActionCreatorFn<A extends Partial<StoreAction>, K> = (handlerFunc: (...params: K[]) => A) => A;

const instanceOfInjectableStore = (value: any) => 'getInjectedStore' in value;

export interface IInjectableStore<T, A extends Partial<StoreAction>> {
  state$: Observable<T>;

  /**
   * @description Returns the inner flux store object
   */
  getInjectedStore(): DrewlabsFluxStore<T, A>;
}

export abstract class InjectableStore<T, A extends Partial<StoreAction>> implements IInjectableStore<T, A> {
  get state$(): Observable<T> {
    return this.getInjectedStore().connect();
  }

  abstract getInjectedStore(): DrewlabsFluxStore<T, A>;
}

export class DrewlabsFluxStore<T, AType extends Partial<StoreAction>> {

  // tslint:disable-next-line: variable-name
  state$: Observable<T>;

  // tslint:disable-next-line: variable-name
  private _actions$ = createSubject<AType | Observable<AType>>();

  /**
   * @description EntityState instance initializer
   */
  constructor(reducer: StateReducerFn<T, AType>, initialState: T) {
    this.state$ = this._actions$.pipe(
      doLog('Before merge mapping: '),
      concatMap((action) => isObservable(action) ? action as Observable<AType> : observableOf<AType>(action) as Observable<AType>),
      filter(state => isDefined(state)),
      startWith(initialState as any),
      scan(reducer),
      doLog('State after applying reducers: '),
      shareReplay(1)
    );
  }

  public bindActionCreator = <K>(handler: ActionCreatorHandlerFn<AType>) => (...args: any) => {
    const action = handler.call(null, ...args) as AType;
    this._actions$.next(action);
    if (isObservable<any>(action.payload)) {
      // Simulate a wait before calling the next method
      observableOf([action.payload])
        .pipe(
          first(),
          delay(10)
        )
        .subscribe(state => {
          this._actions$.next(state[0]);
        });
    }
    return action;
  }

  /**
   * @description Connect to the store data stream
   */
  public connect = () => this.state$;
}


// tslint:disable-next-line: typedef
export function createAction<T, A, K>(
  rxStore: DrewlabsFluxStore<T, A> | IInjectableStore<T, A>, actionCreator: ActionCreatorHandlerFn<A>
) {
  if (instanceOfInjectableStore(rxStore)) {
    return (rxStore as IInjectableStore<T, A>).getInjectedStore().bindActionCreator<K>(actionCreator);
  }
  return (rxStore as DrewlabsFluxStore<T, A>).bindActionCreator<K>(actionCreator);
}

export const createStore = <T, K>(reducer: StateReducerFn<T, K>, initialState: T) => {
  return new DrewlabsFluxStore(reducer, initialState);
};

export const onErrorAction = <T, A>(
  store: DrewlabsFluxStore<T, Partial<A>>) =>
  createAction(store, (payload: any) =>
    ({ type: DefaultStoreAction.ERROR_ACTION, payload } as any));

export const onInitStoreStateAction = <T, A>(
  store: DrewlabsFluxStore<T, Partial<A>>) =>
  createAction(store, (payload: T = {} as T) =>
    ({ type: DefaultStoreAction.INITIALIZE_STORE_STATE, payload } as any));

export const asyncUIAction = <T, A>(
  store: DrewlabsFluxStore<T, Partial<A>>) =>
  createAction(store, (payload: T = {} as T) =>
    ({ type: DefaultStoreAction.ASYNC_UI_ACTION, payload } as any));
