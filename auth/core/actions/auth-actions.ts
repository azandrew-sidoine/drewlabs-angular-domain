import { IUserRememberTokenParam } from '../../../auth-token/contracts';
import { createAction, DrewlabsFluxStore, StoreAction } from '../../../rxjs/state/rx-state';
import { Authorizable, IAppUser, NotifiableUserDetails } from '../../contracts/v2';

/**
 * @description Type definition for authentication service state
 */
export interface AuthState {
  isLoggedIn: boolean;
  is2FactorAuthActive?: boolean;
  isInitialState?: boolean;
  user?: IAppUser | Authorizable | NotifiableUserDetails;
  token?: string;
  authenticating?: boolean;
  rememberToken?: IUserRememberTokenParam;
}

export interface AuthStorageValues {
  user: IAppUser | Authorizable | NotifiableUserDetails;
  token: string;
  rememberToken: IUserRememberTokenParam;
}

export enum AuthStoreActions {
  INIT_AUTHENTICATION_STATE_ACTION = '[INIT_AUTHENTICATION_STATE]',
  AUTHENTICATING_ACTION = '[AUTHENTICATING]',
  AUTHENTICATION_REQUEST_COMPLETED = '[AUTHENTICATION_COMPLETED]'
}

export interface AuthStateAction extends StoreAction {
  payload: Partial<AuthState> | boolean;
}

export const authenticatingAction = (store: DrewlabsFluxStore<Partial<AuthState>, Partial<AuthStateAction>>) =>
  createAction(store, () => {
    return {
      type: AuthStoreActions.AUTHENTICATING_ACTION,
    };
  });

export const authenticationRequestCompletedAction = (store: DrewlabsFluxStore<Partial<AuthState>, Partial<AuthStateAction>>) =>
  // console.log(store)
  createAction(store, (payload: boolean) => {
    console.log("HHHHHHH",store)
    return {
      type: AuthStoreActions.AUTHENTICATION_REQUEST_COMPLETED,
      payload
    };
  });



export const intitAuthStateAction = (store: DrewlabsFluxStore<Partial<AuthState>, Partial<AuthStateAction>>) =>
  createAction(store, (payload: Partial<AuthState>) => {
    return {
      type: AuthStoreActions.INIT_AUTHENTICATION_STATE_ACTION,
      payload
    };
  });
