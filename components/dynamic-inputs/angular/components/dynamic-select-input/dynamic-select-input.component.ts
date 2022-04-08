import {
  Component,
  Input,
  Output,
  EventEmitter,
  Inject,
  OnDestroy,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { createStateful, createSubject } from '../../../../../rxjs/helpers';
import { map, switchMap, takeUntil, tap } from 'rxjs/operators';
import {
  httpHost,
} from '../../../../../http/helpers';
import { controlBindingsSetter } from '../../../core/helpers';
import { DynamicInputTypeHelper } from '../../services/input-type.service';
import { SelectInput } from '../../../core/types/select';
import { InputEventArgs } from '../../types/dynamic-inputs';
import { JSObject } from '../../../../../utils';
import { API_BINDINGS_ENDPOINT, API_HOST } from '../../tokens';
import { HttpClient } from 'src/app/lib/core/http/core';
@Component({
  selector: 'app-dynamic-select-input',
  templateUrl: './dynamic-select-input.component.html',
  styles: [
    `
      .ng-select,
      :host ::ng-deep .ng-select {
        display: block;
        max-width: 100% !important;
        width: 100%;
        border-bottom-color: var(--clr-forms-border-color, #b3b3b3);
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
        background: rgba(244, 244, 244, 0.3);
      }
      :host ::ng-deep .ng-select .ng-select-container,
      :host ::ng-deep .ng-select.ng-select-single .ng-select-container {
        min-height: 26px;
      }
      :host ::ng-deep .ng-select.ng-select-single .ng-select-container {
        height: 26px;
      }
    `,
  ],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicSelectInputComponent implements OnDestroy {
  @Input() controlDivContainerClass: string = 'clr-form-control';
  private _control!: FormControl;
  @Input() set control(value: FormControl) {
    this._control = value;
  }
  get control(): FormControl {
    return this._control as FormControl;
  }
  @Input() showLabelAndDescription = true;
  // tslint:disable-next-line: variable-name
  _performingAction$ = createStateful(false);
  // tslint:disable-next-line: variable-name
  _inputItems$ = createStateful<{ performingAction: boolean; state: any[] }>({
    performingAction: false,
    state: [],
  });
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
  @Output() selected = new EventEmitter<InputEventArgs>();

  // tslint:disable-next-line: variable-name
  _controlFocusEvent$ = createSubject<{ state: any[] }>();

  private _actionSubject$ = createStateful(false);
  performingAction$ = this._actionSubject$.asObservable();

  // tslint:disable-next-line: variable-name
  private _destroy$ = createSubject();

  constructor(
    public readonly inputType: DynamicInputTypeHelper,
    private client: HttpClient,
    @Inject(API_BINDINGS_ENDPOINT) path: string,
    @Inject(API_HOST) host: string
  ) {
    this._controlFocusEvent$
      .pipe(
        tap((state) => {
          this._inputItems$.next({ ...state, performingAction: true });
          this._actionSubject$.next(true);
        }),
        switchMap(() =>
          this.client
            .get(`${httpHost(host)}/${path}`, {
              params: {
                table_config: this._inputConfig.serverBindings,
              },
            })
            .pipe(
              map((state) => {
                if (state && Array.isArray(state)) {
                  return controlBindingsSetter(state)(this._inputConfig)
                    .items as any[];
                }
                return [];
              }),
              takeUntil(this._destroy$),
              tap((state) => {
                this._inputItems$.next({ performingAction: false, state });
                this._actionSubject$.next(false);
              })
            )
        )
      )
      .subscribe();
  }

  onFocus(): void {
    const { state } = this._inputItems$.getValue();
    if (
      !(typeof state !== 'undefined' && state !== null) ||
      (JSObject.isEmpty(state) && this._inputConfig.serverBindings)
    ) {
      // Load the data from the remote server
      this._controlFocusEvent$.next({ state });
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next({});
  }
}
