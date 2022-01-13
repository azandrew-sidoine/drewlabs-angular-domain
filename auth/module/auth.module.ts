import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthGuardService, AuthorizationsGuard, RootComponentGuard } from '../core/auth-guard.service';
import { UserStorageProvider } from '../core/services/user-storage';
import { GenericUndecoratedSerializaleSerializer } from '../../built-value/core/js/serializer';
import { AppUser, IAppUser } from '../contracts/v2/user/user';
import { IGenericSerializableBuilder, ISerializableBuilder } from '../../built-value/contracts';
import { AuthInterceptorService } from '../core/auth-interceptor.service';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MapToHandlerResponse } from '../../rxjs/types';
import { DrewlabsV2LoginResultHandlerFunc } from '../rxjs/operators/v2/login-response';


export interface AuthServerConfigs {

  host: string;
  loginPath: string;
  logoutPath: string;
  usersPath?: string;
  rolesPath?: string;
  authorizationsPath?: string;
  agencesPath?: string;
  departmentsPath?: string;
  companiesPath?: string;

}

export interface AuthModuleConfigs {
  loginResponseHandler: MapToHandlerResponse<any>;
  serverConfigs?: AuthServerConfigs;
  userSerializer?: IGenericSerializableBuilder<IAppUser> | ISerializableBuilder<IAppUser>;
}
@NgModule({
  imports: [
    CommonModule
  ]
})
export class AuthModule {
  static forRoot(config?: AuthModuleConfigs): ModuleWithProviders<AuthModule> {
    return {
      ngModule: AuthModule,
      providers: [
        {
          provide: 'USER_SERIALIZER',
          useValue: config ? config.userSerializer || (new GenericUndecoratedSerializaleSerializer<AppUser>())
            : (new GenericUndecoratedSerializaleSerializer<AppUser>())
        },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptorService, multi: true },
        RootComponentGuard,
        AuthGuardService,
        UserStorageProvider,
        AuthorizationsGuard,
        {
          provide: 'LOGIN_RESPONSE_HANDLER_FUNC',
          useValue: config.loginResponseHandler || DrewlabsV2LoginResultHandlerFunc
        },
        {
          provide: 'AUTH_SERVER_HOST',
          useValue: config?.serverConfigs?.host || null
        },
        // {
        //   provide: 'AUTH_LOGIN_PATH',
        //   useValue: config?.serverConfigs?.loginPath || 'auth/login'
        // },
        {
          provide: 'AUTH_LOGIN_PATH',
          useValue: config?.serverConfigs?.loginPath || 'login'
        },
        {
          provide: 'AUTH_LOGOUT_PATH',
          useValue: config?.serverConfigs?.logoutPath || 'auth/logout'
        },
        {
          provide: 'AUTH_USERS_RESOURCE_PATH',
          useValue: config?.serverConfigs?.usersPath || 'admin/users'
        },
        {
          provide: 'AUTH_ROLES_RESOURCE_PATH',
          useValue: config?.serverConfigs?.rolesPath || 'admin/roles'
        },
        {
          provide: 'AUTH_AUTHORIZATIONS_RESOURCE_PATH',
          useValue: config?.serverConfigs?.authorizationsPath || 'admin/authorizations'
        },
        {
          provide: 'AUTH_DEPARTMENTS_RESOURCE_PATH',
          useValue: config?.serverConfigs?.departmentsPath || 'admin/departments'
        },
        {
          provide: 'AUTH_COMPANIES_RESOURCE_PATH',
          useValue: config?.serverConfigs?.companiesPath || 'admin/companies'
        },
        {
          provide: 'AUTH_AGENCES_RESOURCE_PATH',
          useValue: config?.serverConfigs?.agencesPath || 'admin/companies'
        }
      ],
    };
  }
}
