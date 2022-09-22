import { IUserStorageHandler } from '../../contracts/v2/user/storage-user';
import { IAppUser } from '../../contracts/v2';
import { Inject, Injectable } from '@angular/core';
import { IGenericSerializableBuilder, ISerializableBuilder } from '../../../built-value/contracts/serializers';
import { SessionStorage } from '../../../storage/core';
import { AuthStorageConfig } from '../config';
import { AppUser, Authorizable, NotifiableUserDetails } from '../../contracts/v2/user/user';
import { createStateful } from '../../../rxjs/helpers';
import { Observable } from 'rxjs';

@Injectable()
export class UserStorageProvider implements IUserStorageHandler {

  public constructor(
    private cache: SessionStorage,
    @Inject('USER_SERIALIZER') private serializer: IGenericSerializableBuilder<IAppUser> | ISerializableBuilder<IAppUser>) { }

  // tslint:disable-next-line: variable-name
  public _appUser$ = createStateful<IAppUser | Authorizable | NotifiableUserDetails>(null);
  get appUser$(): Observable<IAppUser | Authorizable | NotifiableUserDetails> {
    return this._appUser$.asObservable();
  }

  get user(): IAppUser | Authorizable | NotifiableUserDetails {
    return this.getUserFromCache();
  }

  /**
   * @inheritdoc
   */
  addUserToCache = (params: IAppUser) => {
    this._appUser$.next(params);
    this.cache.set(AuthStorageConfig.USER_STORAGE_KEY, params);
    // this.cache.set(AuthStorageConfig.USER_STORAGE_KEY, this.serializer.toSerialized(params));
    console.log("PARMASAS", this.serializer.toSerialized(params))
  }
  /**
   * @inheritdoc
   */
  getUserFromCache: () => IAppUser = () => {
    const serializedUser = this.cache.get(AuthStorageConfig.USER_STORAGE_KEY);
    if (serializedUser) {
      const user = this.serializer.fromSerialized(AppUser, serializedUser);
      return user;
    }
    return serializedUser;
  }
  /**
   * @inheritdoc
   */
  removeUserFromCache = () => {
    this._appUser$.next(null);
    this.cache.delete(AuthStorageConfig.USER_STORAGE_KEY);
  }
}
