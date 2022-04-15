import { Observable } from "rxjs";

export interface ActionResult<T> {
  /**
   * @description Returns the value contain in the result
   */
  value(): T;
}

/**
 * Union type defining the result of a handler result
 */
type HandlerResult<V> = ActionResult<V> | void;

export interface ActionHandler<T, A> {
  // State of the forms provider class
  state$: Observable<T>;

  /**
   * Send an action to be performed to handled by the handler
   * @param action
   * @param payload
   */
  handle(action: A, payload?: Partial<T> | any): HandlerResult<any>;
}
