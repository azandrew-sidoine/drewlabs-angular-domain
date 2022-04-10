import { Observable } from "rxjs";
import { FormInterface } from "../compact";

export interface FormsLoader {
  /**
   * Provides an abstraction for loading dynamic form definitions
   * from an asset configuration file, a remote server
   *
   * @param endpoint
   * @param options
   */
  load(
    endpoint: string,
    options?: { [index: string]: any }
  ): Observable<FormInterface[]>;
}

export interface CacheProvider {

  /**
   *
   * @param id
   */
  get(id: string|number): Observable<FormInterface|undefined>;

  /**
   *
   * @param values
   */
  getList(values: string[]|number[]): Observable<FormInterface[]>;

  /**
   * Provides predefined dynamic forms loader implementation
   *
   * @param endpoint
   * @param options
   */
  cache(
    endpoint: string,
    options?: { [index: string]: any }
  ): Observable<never> | Observable<FormInterface[]>;
}
