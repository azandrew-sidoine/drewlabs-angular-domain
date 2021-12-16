import { createStore, onErrorAction } from "../../../../../rxjs/state/rx-state";
import { FormState, updateFormAction } from "../actions";
import { formsReducer } from "../reducers";
import { Observable, throwError } from "rxjs";
import { Inject, Injectable } from "@angular/core";
import { DrewlabsRessourceServerClient } from "../../../../../http/core";
import {
  createFormAction,
  createFormControlAction,
  deleteFormFormControl,
  updateFormControlAction,
} from "../actions/form";
import { catchError, map } from "rxjs/operators";
import { getResponseDataFromHttpResponse } from "../../../../../http/helpers";
import { FormV2 } from "../models/form";
import { FORM_RESOURCES_PATH } from "../../../dynamic-form-control";

const initialState: FormState = {
  collections: {
    currentPage: 1,
    total: 0,
    items: {},
    data: [],
    lastPage: null,
    nextPageURL: null,
    lastPageURL: null,
  },
  selectedFormId: null,
  currentForm: null,
  performingAction: false,
  error: null,
  createResult: null,
  updateResult: null,
  deleteResult: null,
  createControlResult: null,
  updateControlResult: null,
  deleteControlResult: null,
};

@Injectable({
  providedIn: "root",
})
export class FormsProvider {
  public readonly store$ = createStore(formsReducer, initialState);

  constructor(
    private client: DrewlabsRessourceServerClient,
    @Inject(FORM_RESOURCES_PATH) private path: string
  ) {}

  // tslint:disable-next-line: typedef
  get state$(): Observable<FormState> {
    return this.store$.connect();
  }

  update = (url: string, body: { [index: string]: any }) =>
    (() => {
      updateFormAction(this.store$)(this.client, url, body);
    })();

  create = (url: string, body: { [index: string]: any }) =>
    (() => {
      createFormAction(this.store$)(this.client, url, body);
    })();

  updateControl = (url: string, body: { [index: string]: any }) =>
    (() => {
      updateFormControlAction(this.store$)(this.client, url, body);
    })();

  createControl = (url: string, body: { [index: string]: any }) =>
    (() => {
      createFormControlAction(this.store$)(this.client, url, body);
    })();

  deleteFormFormControl = (url: string, controlID: number) =>
    (() => {
      return deleteFormFormControl(this.store$)(url, {}, controlID);
    })();

  getAll = (
    params: { [index: string]: any },
    callback?: (value: any[]) => FormV2[]
  ) =>
    (() =>
      this.client.get(this.path, { params }).pipe(
        map((state) => {
          const data = getResponseDataFromHttpResponse(state);
          return callback ? callback(data || []) : (data as any[]);
        }),
        catchError((err) => {
          onErrorAction(this.store$)(err);
          return throwError(err);
        })
      ))();
}
