import { IAuthTokenHandler, IRememberTokenHandler } from '../../../auth-token/contracts';
import { Observable } from 'rxjs';
import { ILoginResponse, IAppUser } from '../../../auth/contracts/v2';
import { ILoginState } from '../../../auth/contracts/v2/login.response';
import { getResultData } from '../../../http/contracts/types';
import { responseStatusOK } from '../../../http/core/helpers';
import { IUserStorageHandler } from '../../../auth/contracts/v2/user/storage-user';
import { map } from 'rxjs/operators';
import { IHttpResponseData } from '../../../http/contracts/http-response';
import { HandlerResult, LoginReponseHandlerFunc, LoginResponseWithAuthenticationResult } from '../../../rxjs/types';

/**
 * @description Get the login response data structure from the {@link HandlerResult} instance
 * @param result Login result|response instance
 */
export const getLoginResponse: getResultData<ILoginResponse> = (result: HandlerResult<ILoginResponse>) => result.data;

/**
 * @description Get the login state data from user login response object
 * @param loginResponse Login result|response instance
 */
export const getLoginState: (response: IHttpResponseData) => ILoginState =
  (response: IHttpResponseData) => response.getContent().loginState;

/**
 * @description Helper method for checking the login result was successful
 * @param loginResponse Instance of the {@link ILoginResponse}
 */
export const drewlabsIsAuthenticationSuccessful: (loginResponse: ILoginResponse) => boolean =
  (loginResponse: ILoginResponse) => loginResponse.success && responseStatusOK(loginResponse.statusCode);

/**
 * @description Checks user has double authentication activated on his account
 * @param loginState Login state instance
 */
export const isDoubleAuthActive: (loginState: ILoginState) => boolean =
  (loginState: ILoginState) => loginState.is2FactorAuthenticationEnabled;

/**
 * @description Get logged in user from the login reponse parameter
 * @param response Login result|response instance
 */
export const getLoggedInUser: (response: IHttpResponseData) => IAppUser =
  (response: IHttpResponseData) => response.getContent().user;

export const onAuthenticationResultEffect: LoginReponseHandlerFunc<LoginResponseWithAuthenticationResult> = (
  userStorageHandler: IUserStorageHandler,
  tokenProvider: IAuthTokenHandler,
  rememberProvider: IRememberTokenHandler,
  remember = false
) => {
  return (source$: Observable<any>) => {
    return source$.pipe(
      map(state => {
        console.log(state)
        let is2FactorAuthEnabled = false;
        let isAutenticated = false;
        const loginResponse = getLoginResponse(state);
        console.log(loginResponse);
        if (drewlabsIsAuthenticationSuccessful(loginResponse)) {
          isAutenticated = true;
          // Check if is double authentication active
          const loginState = getLoginState(loginResponse);
          console.log(loginState)
          if (!isDoubleAuthActive(loginState)) {
            is2FactorAuthEnabled = false;

            // Put user details to into app local storage
            tokenProvider.setToken(loginState.token);
            const authenticatedUser = getLoggedInUser(loginResponse);
            if (Boolean(remember)) {
              rememberProvider.setToken({ userId: authenticatedUser.id, token: authenticatedUser.rememberToken });
            }
            userStorageHandler.addUserToCache(authenticatedUser);
          } else {
            is2FactorAuthEnabled = true;
          }
        }
        return { is2FactorAuthEnabled, isAutenticated, loginResponse };
      })
    );
  };
};
