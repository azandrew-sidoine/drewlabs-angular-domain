import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { isServerErrorResponse, isUnAuthorizedResponse } from '../http';
import { HTTPErrorState } from '../http/contracts';
import { UIState, UIStateProvider, UIStateStatusCode } from './types';

const initialUIState: UIState = {
  performingAction: false,
  uiMessage: undefined,
  hasError: false,
  status: undefined,
};

/**
 * @description UIstate status code helper for getting state from http response error status
 */
export const uiStatusUsingHttpErrorResponse = (
  httpErrorState: HTTPErrorState
) =>
  isServerErrorResponse(httpErrorState.status)
    ? UIStateStatusCode.ERROR
    : isUnAuthorizedResponse(httpErrorState.status)
    ? UIStateStatusCode.UNAUTHORIZED
    : UIStateStatusCode.BAD;

@Injectable()
export class AppUIStateProvider implements UIStateProvider {
  store$ = new ReplaySubject<UIState>(1);

  get uiState(): Observable<UIState> {
    return this.store$.pipe(startWith(initialUIState));
  }

  startAction(message?: string): void {
    this.store$.next({
      performingAction: true,
      uiMessage: message,
      hasError: false,
      status: undefined,
    });
  }

  endAction(message?: string, status?: UIStateStatusCode): void {
    this.store$.next({
      performingAction: false,
      uiMessage: message,
      hasError: status === UIStateStatusCode.ERROR ? true : false,
      status,
    });
  }

  resetState(): void {
    this.store$.next(initialUIState);
  }
}
