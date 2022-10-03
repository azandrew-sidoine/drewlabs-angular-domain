import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptorService implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = this.auth.getAuthorizationToken();
    if (token) {
      const headers = req.headers.set('Authorization', `Bearer ${token}`);
      // Clone the request and replace the original headers with
      // cloned headers, updated with the authorization.
      req = req.clone({ headers });
    }
    return next.handle(req);
  }
}
