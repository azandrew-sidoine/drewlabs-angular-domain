import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { getEnv } from "../../utils";
import { Log } from "../../utils/logger";

// Helper rxjs operator for logging emitted stream while running in development mode
/**
 * @description Helper rxjs operator for logging emitted stream while running in development mode
 * ```js
 * const stream$ = sourceStream$.pipe(
 *    doLog(),
 *    map(...),
 *    publishReplay()
 * );
 * ```
 */
export const doLog = <T>(prefix?: string) => {
  return (source$: Observable<T>) =>
    source$.pipe(
      tap((source) => {
        // tslint:disable-next-line: no-unused-expression
        getEnv("production")
          ? null
          : prefix
          ? Log(prefix, source)
          : Log(source);
      })
    );
};

export { mapToHttpResponse } from "./map-to-response-type";
