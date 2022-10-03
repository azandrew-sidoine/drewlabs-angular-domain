import { Inject, Injectable, OnDestroy } from '@angular/core';
import { tap, startWith, takeUntil, map } from 'rxjs/operators';
import { createSubject } from 'src/app/lib/core/rxjs/helpers';
import { createStore } from 'src/app/lib/core/rxjs/state/rx-state';
import { SessionStorage } from 'src/app/lib/core/storage/core';
import {
  DEFAULT_POSITION_OPTIONS,
  GEOLOCATION,
  IS_GEOLOCATION_SUPPORTED,
} from '../tokens/geolocation';
import { GeolocationState, onGeolocationPositionAction } from './actions';
import { geolocationReducer } from './reducers';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
} from '@angular/common/http';
import { doLog } from 'src/app/lib/core/rxjs/operators';
import { isDefined } from '../../../types';
import { isEmpty } from 'lodash';

const BROWSER_POSITION_SESSION_KEY = 'CLIENT_GEOLOCATION_LOCATION';

interface GeoPosition {
  coords?: Partial<{
    accuracy: number;
    altitude?: number;
    altitudeAccuracy?: number;
    heading?: any;
    latitude: number;
    longitude: number;
  }>;
  timestamps?: number;
}

@Injectable()
export class GeolocationService implements OnDestroy {
  private _destroy$ = createSubject();
  private _watchPositionId = 0;
  private readonly _changes$ = createSubject<GeolocationPosition>();
  public readonly changes$ = this._changes$.pipe(
    startWith({} as GeolocationPosition)
  );

  private readonly _currentPosition$ = createSubject<GeolocationPosition>();

  public readonly currentPosition$ = this._changes$.pipe(
    startWith({} as GeolocationPosition)
  );

  public readonly store$ = createStore(geolocationReducer, {
    position: undefined,
  });

  public tempPosition!: GeoPosition;

  public readonly state$ = this.store$.connect().pipe(
    map((state) => state?.position),
    takeUntil(
      this._destroy$.pipe(
        doLog('Clearing data...'),
        tap((_) => {
          this.geolocationRef.clearWatch(this._watchPositionId);
          this.session.delete(BROWSER_POSITION_SESSION_KEY);
        })
      )
    ),
    // distinctUntilChanged((x, y) => (x?.position?.coords?.altitude === y?.position?.coords?.altitude) && (x?.position?.coords?.longitude === y?.position?.coords?.longitude)),
    doLog('Setting Browser location: '),
    tap((state) => {
      if (state) {
        this.setPosition(state);
      }
    })
  );

  getPosition(): GeoPosition {
    let value = this.session.get(BROWSER_POSITION_SESSION_KEY);
    value = !isDefined(value) || isEmpty(value) ? this.tempPosition : value;
    return this.tempPosition;
  }

  public setPosition(state: GeolocationPosition) {
    const position: GeoPosition = {
      coords: {
        accuracy: state?.coords?.accuracy,
        altitude: state?.coords?.altitude || undefined,
        altitudeAccuracy: state?.coords?.altitudeAccuracy || undefined,
        heading: state?.coords?.heading,
        latitude: state?.coords?.latitude,
        longitude: state?.coords?.longitude,
      },
      timestamps: state?.timestamp,
    };
    this.tempPosition = position;
    this.session.set(BROWSER_POSITION_SESSION_KEY, position);
  }

  constructor(
    @Inject(GEOLOCATION) private geolocationRef: Geolocation,
    @Inject(IS_GEOLOCATION_SUPPORTED) isGeolocationSupported: boolean,
    @Inject(DEFAULT_POSITION_OPTIONS) private positionOptions: PositionOptions,
    private session: SessionStorage
  ) {
    if (!isGeolocationSupported) {
      this._changes$.error('Geolocation is not supported in your browser');
    }
    this._watchPositionId = this.geolocationRef.watchPosition(
      (position) => {
        this._changes$.next(position);
        onGeolocationPositionAction(this.store$)({
          position,
        } as Partial<GeolocationState>);
      },
      (error) => {
        this._changes$.error(error);
        onGeolocationPositionAction(this.store$)({
          error,
        } as Partial<GeolocationState>);
      },
      this.positionOptions
    );
  }

  public publishCurrentPosition(): void {
    this._currentPosition$
      .asObservable()
      .pipe(
        takeUntil(this._destroy$),
        tap((state) => this.setPosition(state))
      )
      .subscribe();
    // Get the current position
    this.geolocationRef.getCurrentPosition(
      (position) => {
        this._currentPosition$.next(position);
        onGeolocationPositionAction(this.store$)({
          position,
        } as Partial<GeolocationState>);
      },
      (error) => {
        this._currentPosition$.error(error);
        onGeolocationPositionAction(this.store$)({
          error,
        } as Partial<GeolocationState>);
      },
      this.positionOptions
    );
  }

  ngOnDestroy(): void {
    this._destroy$.next();
  }
}

@Injectable()
export class GeolocationInterceptorService implements HttpInterceptor {
  constructor(private service: GeolocationService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const position = this.service.getPosition();
    if (position) {
      let headers = req.headers.set(
        'X-CLIENT-LAT',
        `${position?.coords?.latitude}`
      );
      headers = headers.set('X-CLIENT-LONG', `${position?.coords?.longitude}`);
      // Clone the request and replace the original headers with
      // cloned headers, updated with the authorization.
      req = req.clone({ headers });
    }
    return next.handle(req);
  }
}
