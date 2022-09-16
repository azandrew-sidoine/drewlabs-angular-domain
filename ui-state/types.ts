import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";

export enum UIStateStatusCode {
  /**
   * @deprecated
   */
  STATUS_OK = 200,
  /**
   * @deprecated
   */
  STATUS_CREATED = 201,
  /**
   * @deprecated
   */
  BAD_REQUEST = 422,
  /**
   * @deprecated
   */
  WARNING = 422,


  UNAUTHORIZED = 401,
  AUTHENTICATED = 202,
  UNAUTHENTICATED = 403,
  BAD = 400 || 422 || 401,
  OK = 200 || 201,
  ERROR = 500,
}

export interface UIState {
  performingAction: boolean;
  uiMessage?: string;
  hasError?: boolean;
  status?: number;
}

export interface UIStateProvider {

  uiState: Observable<UIState>;

  startAction(message?: string): void;

  endAction(message?: string, status?: UIStateStatusCode | any): void;

  resetState(): void;
}

/**
 * @description Provider for the UI state service
 * @var UIStateProvider
 */
export const UI_STATE_PROVIDER = new InjectionToken<UIStateProvider>(
  'UI State Provider'
);

