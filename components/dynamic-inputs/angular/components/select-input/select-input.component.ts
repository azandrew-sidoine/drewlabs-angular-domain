import {
  Component,
  Input,
  Output,
  EventEmitter,
  Inject,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { InputTypeHelper } from '../../services/input-type';
import { InputEventArgs } from '../../types/input';
import {
  SelectableControlItems,
  SelectInput,
  setControlOptions,
} from '../../../core';
import { BehaviorSubject, Subject } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { FetchOptionsDirective } from '../../directives';
@Component({
  selector: 'ngx-smart-select-input',
  templateUrl: './select-input.component.html',
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
      :host ::ng-deep .ng-select .ng-select-container,
      :host ::ng-deep .ng-select.ng-select-single .ng-select-container {
        min-height: 26px;
      }
      :host ::ng-deep .ng-select.ng-select-single .ng-select-container {
        height: 26px;
      }
    `,
  ],
})
export class SelectInputComponent implements AfterViewInit {
  @Input() control!: FormControl;
  @Input() showLabelAndDescription = true;
  // tslint:disable-next-line: variable-name
  _inputItems$ = new BehaviorSubject<{
    performingAction: boolean;
    state: any[];
    loaded: boolean;
  }>({
    performingAction: false,
    state: [],
    loaded: false,
  });
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
  _controlFocusEvent$ = new Subject<{ state: any[] }>();

  private _handleFetchOnFocus: boolean = false;

  @ViewChild('prefetchOptionsDirective', { static: false })
  prefetchOptionsDirective!: FetchOptionsDirective;

  constructor(
    public readonly inputType: InputTypeHelper,
    @Inject(DOCUMENT) private document: Document
  ) {
    const { defaultView } = this.document;
    this._handleFetchOnFocus = !(
      defaultView !== null &&
      'IntersectionObserver' in defaultView &&
      'IntersectionObserverEntry' in defaultView &&
      'intersectionRatio' in defaultView.IntersectionObserverEntry.prototype
    );
  }
  ngAfterViewInit(): void {
    if (this._inputConfig) {
      const values = this.inputType.asSelectInput(this._inputConfig).items;
      this._inputItems$.next({
        ...this._inputItems$.getValue(),
        state: values,
        loaded: values.length !== 0,
      });
    }
  }

  onFocus(): void {
    if (this.prefetchOptionsDirective && this._handleFetchOnFocus) {
      this.prefetchOptionsDirective.executeQuery();
    }
  }

  onLoadedChange(loaded: boolean) {
    const value = this._inputItems$.getValue();
    this._inputItems$.next({ ...value, loaded });
  }

  onItemsChange(state: SelectableControlItems[]) {
    this._inputConfig = setControlOptions(this._inputConfig, state);
    const value = this._inputItems$.getValue();
    this._inputItems$.next({ ...value, state: this._inputConfig.items ?? [] });
  }
}
