import { Observable, Subject, BehaviorSubject, of, EMPTY, from, ObservableInput } from 'rxjs';
import { GenericObserverHandlerFunc } from '../types';

/**
 * @description Generic method for creating an rxjs subject of a specified type
 */
export const createSubject = <T>() => {
  return new Subject<T>();
};

/**
 * @description Generic method for creating an rxjs behaviourSubject of a specified type
 */
export const createStateful = <T>(initialState: T) => {
  return new BehaviorSubject(initialState);
};


// Create an observable from a function
/**
 * @description Creator function utility for RxJS observable create function.
 */
export const createObservable = <T>(handlerFunc: GenericObserverHandlerFunc<T>) => {
  if (typeof handlerFunc !== 'function') {
    throw new Error('Undefined observable handler function param');
  }
  return new Observable(handlerFunc);
};


export const observableOf = <T>(stream: T) => of(stream);

export const observableFrom = <T>(stream: ObservableInput<T>) => from(stream);

/**
 * @description Check if a given value is an observable
 * @param value Any type of data that can be checks for observable instance
 */
export const isObservable = (value: any) => value instanceof Observable;

/**
 * @description Returns an empty observable
 */
export const emptyObservable = () => observableFrom(EMPTY);

