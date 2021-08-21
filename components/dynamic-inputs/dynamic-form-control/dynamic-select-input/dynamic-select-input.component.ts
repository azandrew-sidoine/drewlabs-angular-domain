import { Component, Input, Output, EventEmitter, Inject, OnDestroy } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { DynamicInputTypeHelper } from '../input-type.service';
import { SelectInput } from '../../core/input-types';
import { createStateful, createSubject } from '../../../../rxjs/helpers/index';
import { isDefined } from '../../../../utils/types';
import { DrewlabsRessourceServerClient } from '../../../../http/core';
import { map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { getResponseDataFromHttpResponse } from '../../../../http/helpers';
import { isArray, isEmpty } from 'lodash';
import { controlBindingsSetter } from '../../core/helpers';
import { doLog } from '../../../../rxjs/operators';
import { httpServerHost } from 'src/app/lib/core/utils/url/url';
@Component({
  selector: 'app-dynamic-select-input',
  templateUrl: './dynamic-select-input.component.html',
  styles: [
    `
    .ng-select, :host ::ng-deep .ng-select {
        display: block;
        max-width: 100% !important;
        width: 100%;
    }

    .ng-select.flat {
      border-radius: 0 !important;
    }

    .ng-select.flat .ng-select-container {
      border-radius: 0 !important;
    }
    .required-text,
    .field-has-error {
      color: rgb(241, 50, 50);
    }

    .clr-input-wrapper .clr-input:disabled {
      background: rgba(244, 244, 244, .3);
    }
    :host ::ng-deep .ng-select .ng-select-container, :host ::ng-deep .ng-select.ng-select-single .ng-select-container {
      min-height: 26px;
    }
    :host ::ng-deep .ng-select.ng-select-single .ng-select-container {
      height: 26px;
    }
    `
  ],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicSelectInputComponent implements OnDestroy {

  @Input() controlDivContainerClass: string = 'clr-form-control';
  private _control!: AbstractControl;
  @Input() set control(value: AbstractControl) {
    this._control = value;
  }
  get control(): AbstractControl {
    return this._control;
  }
  @Input() showLabelAndDescription = true;
  // tslint:disable-next-line: variable-name
  _performingAction$ = createStateful(false);
  // tslint:disable-next-line: variable-name
  _inputItems$ = createStateful<{ performingAction: boolean, state: any[] }>({ performingAction: false, state: [] });
  @Input() set inputItems(value: { [index: string]: any }[]) {
    this._inputItems$.next({ performingAction: false, state: value });
  }
  inputItems$ = this._inputItems$.asObservable();

  // tslint:disable-next-line: variable-name
  private _inputConfig!: SelectInput;
  @Input() set inputConfig(value: SelectInput) {
    this._inputConfig = value as SelectInput;
  }
  // tslint:disable-next-line: typedef
  get inputConfig() {
    return this._inputConfig;
  }
  @Output() multiSelectItemRemove = new EventEmitter<any>();
  @Output() inputSelect = new EventEmitter<{ formcontrolname: string, value: any }>();

  // tslint:disable-next-line: variable-name
  _controlFocusEvent$ = createSubject<{ state: any[] }>();

  private _actionSubject$ = createStateful(false);
  performingAction$ = this._actionSubject$.asObservable();

  // tslint:disable-next-line: variable-name
  private _destroy$ = createSubject();

  constructor(
    public readonly inputTypeHelper: DynamicInputTypeHelper,
    private client: DrewlabsRessourceServerClient,
    @Inject('CONTROL_BINDINGS_RESOURCES_PATH') path: string,
    @Inject('FORM_SERVER_HOST') host: string
  ) {
    this._controlFocusEvent$.pipe(
      tap((state) => {
        this._inputItems$.next({ ...state, performingAction: true });
        this._actionSubject$.next(true);
      }),
      doLog('Control focused: '),
      switchMap(() => this.client.get(`${httpServerHost(host)}/${path}`, {
        params: {
          table_config: this._inputConfig.serverBindings
        }
      }).pipe(
        doLog('Load binding result: '),
        map(state => {
          const data = getResponseDataFromHttpResponse(state);
          if (data && isArray(data)) {
            return controlBindingsSetter(data)(this._inputConfig).items as any[];
          }
          return [];
        }),
        takeUntil(this._destroy$),
        tap(state => {
          this._inputItems$.next({ performingAction: false, state });
          this._actionSubject$.next(false);
        })
      ))
    ).subscribe();
  }

  onFocus(): void {
    const { state } = this._inputItems$.getValue();
    if (!isDefined(state) || isEmpty(state) && isDefined(this._inputConfig.serverBindings)) {
      // Load the data from the remote server
      this._controlFocusEvent$.next({ state });
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next({});
  }

}
