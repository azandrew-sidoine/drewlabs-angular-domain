import { IAppUserDetails, AppUserDetails } from './user-details';
import * as lodash from 'lodash';
import { isArray, isDefined } from '../../../../utils/types/type-utils';

/**
 * Checkis if a given authorizable instance has any of the provided authorization
 */
export type AnyScopeFunc = (authorizable: Authorizable, authorizations: string[]) => boolean;

/**
 * Checks if an authorizable instance has a given scope in it authorizations
 */
export type ScopeFunc = (authorizable: Authorizable, authorization: string) => boolean;

/**
 * @description Handler function for checking a given user have any of the provided authorizations
 */
export const userCanAny = (authorizable: Authorizable, authorizations: string[]) => {
  if (!isDefined(authorizable)) {
    return false;
  }
  if (!isDefined(authorizations)) {
    return true;
  }
  if (authorizations.length === 0) {
    return true;
  }
  return lodash.intersection(authorizable.authorizations, authorizations).length > 0;
};

/**
 * @description Handler function checking if a given user has the provided authorization
 */
export const userCan = (authorizable: Authorizable, authorization: string) => {
  console.log("AUTHTHT",authorizable)
  return authorizable.authorizations.indexOf(authorization) !== -1;
};

export interface IAppUser {
  id: number | string;
  username: string;
  isVerified: boolean;
  isActive: boolean;
  is2FactorAuthActive: boolean;
  rememberToken: string;
  userDetails: IAppUserDetails;
}

export interface Authorizable {
  authorizations: string[];
  roles: string[];
}

export interface NotifiableUserDetails {
  channels: object[];
}

export class AppUser implements IAppUser, NotifiableUserDetails, Authorizable {
  username!: string;
  id!: number;
  password!: string;
  rememberToken!: string;
  twoFactorActive!: number;
  authorizations!: string[];
  roles!: string[];
  roleIDs!: number[];
  userDetails!: IAppUserDetails;
  verified!: number | boolean;
  active!: number | boolean;
  doubleAuthActive!: number | boolean;
  channels!: object[];


  get isVerified(): boolean {
    return Boolean(this.verified);
  }

  get isActive(): boolean {
    return Boolean(this.active);
  }

  get is2FactorAuthActive(): boolean {
    return Boolean(this.doubleAuthActive);
  }

  get userInfo(): IAppUserDetails { return this.userDetails; }

  // tslint:disable-next-line: typedef
  get rolesAsString() {
    return isDefined(this.roles) ? isArray(this.roles) ? this.roles.join(', ') : this.roles : '';
  }

  static getJsonableProperties(): {[index: string]: keyof AppUser}|{[index: string]: any} {
    return {
      username: 'username',
      is_verified: 'verified',
      is_active: 'active',
      double_auth_active: 'doubleAuthActive',
      remember_token: 'rememberToken',
      roles: 'roles',
      role_ids: 'roleIDs',
      authorizations: 'authorizations',
      channels: 'channels',
      user_details: { name: 'userDetails', type: AppUserDetails }
    } as { [index: string]: keyof AppUser } | { [index: string]: any };
  }
}

export const userFormViewModel = () => {
  return {
    is_active: 'active',
    double_auth_active: 'active',
    roles: 'roles',
    firstname: 'userDetails.firstname',
    lastname: 'userDetails.lastname',
    address: 'userDetails.address',
    email: 'userDetails.email',
    other_email: 'userDetails.otherEmail',
    phone_number: 'userDetails.phoneNumber',
    postal_code: 'userDetails.postalCode',
    birthdate: 'userDetails.birthdate',
    sex: 'userDetails.sex',
    organisation_name: 'userDetails.company',
    is_affiliated_to_department: '',
    department_id: 'userDetails.departmentID',
    agence_id: 'userDetails.agenceID',
    is_manager: 'userDetails.isManager',
    is_department_manager: 'userDetails.isManager'
  };
};

export const userDetailsFormViewModel = () => {
  return {
    firstname: 'firstname',
    lastname: 'lastname',
    address: 'address',
    email: 'email',
    other_email: 'otherEmail',
    phone_number: 'phoneNumber',
    postal_code: 'postalCode',
    birthdate: 'birthdate',
    sex: 'sex',
    organisation_id: 'organisationID',
    department_id: 'departmentID',
    agence_id: 'agenceID',
    is_manager: 'isManager',
  };
};
