import { Inject, Injectable, OnDestroy } from '@angular/core';
import { AuthPathConfig } from './config';
import { AuthTokenService } from '../../auth-token/core/auth-token.service';
import { HttpRequestService, HTTPErrorState } from '../../http/core/http-request.service';
import { AuthRememberTokenService } from '../../auth-token/core/auth-remember-token.service';
import { createSubject, observableOf } from '../../rxjs/helpers';
import { mapToHttpResponse, doLog } from '../../rxjs/operators';
import { mergeMap, catchError, takeUntil, tap, filter, delay } from 'rxjs/operators';
import { throwError, merge, Observable } from 'rxjs';
import { ILoginRequest, ILoginResponse } from '../contracts/v2';
import { UserStorageProvider } from './services/user-storage';
import { HttpErrorResponse } from '@angular/common/http';
import { ILoginResponseBody } from '../contracts/v2/login.response';
import { IAppUser, Authorizable, NotifiableUserDetails } from '../contracts/v2/user/user';
import { isDefined } from '../../utils/types/type-utils';
import { SessionStorage } from '../../storage/core/session-storage.service';
import { Router } from '@angular/router';
import { HttpRequestConfigs } from '../../http/core';
import { AuthState, AuthStorageValues } from './actions';
import { createStore } from '../../rxjs/state/rx-state';
import { intitAuthStateAction, authenticatingAction, authenticationRequestCompletedAction } from './actions';
import { authReducer } from './reducers';
import { isEmpty } from 'lodash';
import { Log } from '../../utils/logger';
import { MapToHandlerResponse } from '../../rxjs/types';
import { httpServerHost } from '../../utils/url/url';
import { DrewlabsV2LoginResultHandlerFunc } from '../rxjs/operators/v2/login-response';
import { onAuthenticationResultEffect } from '../rxjs/operators/login-response';

const initalState: AuthState = {
  isLoggedIn: false,
  is2FactorAuthActive: false,
  isInitialState: true,
  authenticating: false,
  user: undefined,
  token: undefined
};

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  //slim
  private roles : Array<any> = [];
  private userAuthenticated : UserStorageProvider;

  // tslint:disable-next-line: variable-name
  private _destroy$ = createSubject<{}>();
  // tslint:disable-next-line: variable-name
  private _logoutSubject$ = createSubject<boolean>();

  public readonly logoutState$ = this._logoutSubject$.asObservable();

  // tslint:disable-next-line: variable-name
  private _authStore$ = createStore(authReducer, { authenticating: false, isInitialState: undefined } as AuthState);
  get state$(): Observable<Partial<AuthState>> {
    return this._authStore$.connect().pipe(
      filter(state => !isEmpty(state))
    );
  }

  /**
   * @deprecated
   */
  get user(): IAppUser | Authorizable | NotifiableUserDetails {
    return this.userStorage.user;
  }

  constructor(
    public userStorage: UserStorageProvider,
    private oAuthTokenProvider: AuthTokenService,
    private rememberTokenProvider: AuthRememberTokenService,
    private httpClient: HttpRequestService,
    private sessionStorage: SessionStorage,
    private router: Router,
    @Inject('LOGIN_RESPONSE_HANDLER_FUNC') private loginResponseHandlerFunc: MapToHandlerResponse<any>,
    @Inject('AUTH_SERVER_HOST') private host: string,
    @Inject('AUTH_LOGIN_PATH') private loginPath: string,
    @Inject('AUTH_LOGOUT_PATH') private logoutPath: string
  ) {
    merge(
      this.httpClient.errorState$, observableOf({} as HTTPErrorState
      ).
        pipe(
          takeUntil(this._destroy$),
          delay(0),
          takeUntil(this._destroy$),
          tap(state => {
            this.initState();
            if (isDefined(state.status)) {
              if (state && state.status === 401) {
                this.userStorage.removeUserFromCache();
                this.oAuthTokenProvider.removeToken();
                this.sessionStorage.clear();
                intitAuthStateAction(this._authStore$)();
                this.sessionStorage.set(HttpRequestConfigs.sessionExpiredStorageKey, true);
                // To be review
                this.router.navigate([AuthPathConfig.LOGIN_PATH], { replaceUrl: true });
              }
            }

          })
        ),
    ).subscribe();

    this.logoutState$
      .pipe(
        doLog('Loggin out...'),
        takeUntil(this._destroy$)
      ).subscribe(() => {
        this.userStorage.removeUserFromCache();
        this.oAuthTokenProvider.removeToken();
        this.sessionStorage.clear();
        intitAuthStateAction(this._authStore$)(initalState);
        this.router.navigate([AuthPathConfig.LOGIN_PATH], { replaceUrl: true });
      });
  }

  ngOnDestroy = () => this._destroy$.next();

  /**
   * @description Authenticate user using server credentials and try logging in user
   * @param body Login request body {@link ILogginRequest}
   */
  public authenticate = (body: ILoginRequest) => {
    authenticatingAction(this._authStore$)();
    return this.httpClient
      .post(
        `${httpServerHost(this.host)}/${this.loginPath}`,
        Object.assign(body, { remember_me: body.remember || false })
      ).pipe(
        mapToHttpResponse<ILoginResponse>(this.loginResponseHandlerFunc || DrewlabsV2LoginResultHandlerFunc),
        onAuthenticationResultEffect(this.userStorage, this.oAuthTokenProvider, this.rememberTokenProvider, body.remember || false),
        mergeMap(source => {
          authenticationRequestCompletedAction(this._authStore$)({
            isLoggedIn: Boolean(source.isAutenticated),
            is2FactorAuthActive: Boolean(source.is2FactorAuthEnabled),
            isInitialState: false,
            authenticating: false,
            user: this.userStorage.user,
            token: this.oAuthTokenProvider.token,
            rememberToken: this.rememberTokenProvider.token
          } as AuthState);
          return observableOf(source.loginResponse);
        }),
        catchError((err) => {
          if (err instanceof HttpErrorResponse) {
            return observableOf({
              success: false,
              body: { errorMessage: err.statusText, responseData: undefined, errors: [] } as ILoginResponseBody,
              statusCode: err.status
            } as ILoginResponse);
          }
          return throwError(err);
        }),
      );
  }

  /**
   * @description Handler for authenticating a user via user id and a remember token
   */
  public authenticateViaRememberToken = (body: { id: string | number, token: string }) => {
    authenticatingAction(this._authStore$)();
    return this.httpClient.post(
      `${httpServerHost(this.host)}/${this.loginPath}/${body.id}`,
      { remember_token: body.token }
    ).pipe(
      mapToHttpResponse<ILoginResponse>(this.loginResponseHandlerFunc || DrewlabsV2LoginResultHandlerFunc),
      onAuthenticationResultEffect(this.userStorage, this.oAuthTokenProvider, this.rememberTokenProvider, false),
      mergeMap(source => {
        authenticationRequestCompletedAction(this._authStore$)({
          isLoggedIn: Boolean(source.isAutenticated),
          is2FactorAuthActive: Boolean(source.is2FactorAuthEnabled),
          isInitialState: false,
          authenticating: false,
          user: this.userStorage.user,
          token: this.oAuthTokenProvider.token,
          rememberToken: this.rememberTokenProvider.token
        } as AuthState);
        return observableOf(source.loginResponse);
      }),
      catchError((err) => {
        if (err instanceof HttpErrorResponse) {
          return observableOf({
            success: false,
            body: { errorMessage: err.statusText, responseData: undefined, errors: [] } as ILoginResponseBody,
            statusCode: err.status
          } as ILoginResponse);
        }
        return throwError(err);
      }),
    );
  }

  /**
   * @description Logout the application user
   */
  public logout = () => {
    return this.httpClient
      .get(`${httpServerHost(this.host)}/${this.logoutPath}`).pipe(
        tap(() => {
          this._logoutSubject$.next(true);
        })
      );
  }

  public initState = () => {
    const user = this.userStorage.user;
    const token = this.oAuthTokenProvider.token;
    const rememberToken = this.rememberTokenProvider.token;
    this.setAuthenticationStateFromStoredValues({ user, token, rememberToken });
  }

  setAuthenticationStateFromStoredValues = (state: Partial<AuthStorageValues>) => {
    try {
      let payload = {};
      if ((isDefined(state.user) && isDefined(state.token))) {
        payload = {
          ...state,
          isLoggedIn: Boolean(true),
          is2FactorAuthActive: Boolean((state.user as IAppUser).is2FactorAuthActive),
          isInitialState: true,
        };
      } else {
        payload = {
          ...state,
          isLoggedIn: false,
          is2FactorAuthActive: false,
          isInitialState: true
        };
      }
      intitAuthStateAction(this._authStore$)(payload);
    } catch (error) {
      Log('Error during initialization...', error);
    }
  }

  getAuthorizationToken = () => this.oAuthTokenProvider.token;




  // slim auth
  private jwtToken :string;

  getUserAuthenticated(){
    return this.userAuthenticated;
  }
  isAdmin(){
    for (let r of this.roles){
      if (r.authority == 'ADMIN') return true;
    }
    return false;
  }

  isDirecteur(){
     for (let r of this.roles){
       if (r.authority == 'DIRECTEUR') return true;
     }
     return false;
   }
   loadToken(){
    this.jwtToken = localStorage.getItem('token');
    return this.jwtToken;
  }


}
