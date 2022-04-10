import { Inject, Injectable, InjectionToken, Optional } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { CacheProvider, FormsLoader } from '../../core';
import { FormInterface } from '../../core/compact';
import { DYNAMIC_FORM_LOADER } from './forms-loader';

export const CACHE_PROVIDER = new InjectionToken<CacheProvider>(
  'PROVIDES AN INSTANCE OF CacheProvider::Interface'
);

@Injectable()
export class FormsCacheProvider implements CacheProvider {
  // @internal
  private readonly _cache = new BehaviorSubject<FormInterface[]>([]);

  // @constructor
  constructor(
    @Inject(DYNAMIC_FORM_LOADER) @Optional() private loader: FormsLoader
  ) {}

  /**
   *
   * @param id
   */
  get(id: string | number): Observable<FormInterface | undefined> {
    return this._cache.pipe(
      map((state) => state.find((x) => id.toString() === x.id.toString()))
    );
  }

  /**
   *
   * @param values
   */
  getList(values: string[] | number[]): Observable<FormInterface[]> {
    const values_ = values.map((value: number | string) => value.toString());
    return this._cache.pipe(
      map((state) => state.filter((x) => values_.includes(x.id.toString())))
    );
  }

  // Cache handler method
  cache = (endpoint: string, options: { [index: string]: any } = {}) => {
    return this.loader.load(endpoint, options).pipe(
      tap((state) => {
        // TODO : Add the list of
        this._cache.next(state);
      })
    );
  };
}
