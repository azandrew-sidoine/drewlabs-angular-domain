import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { createSubject } from '../../../rxjs/helpers';

@Component({
  selector: 'app-alert',
  template: `
    <div *ngIf="alertTypeClass$ | async as alertTypeClass" [class]="alertTypeClass" role="alert">
      <div class="alert-items hide-for-print">
        <div class="alert-item static">
          <ng-container *ngIf="showIcon">
            <div class="alert-icon-wrapper" [ngSwitch]="alertType">
              <clr-icon *ngSwitchCase="'alert-success'" class="alert-icon" shape="check-circle"></clr-icon>
              <clr-icon *ngSwitchCase="'alert-danger'" class="alert-icon" shape="exclamation-circle"></clr-icon>
              <clr-icon *ngSwitchCase="'alert-warning'" class="alert-icon" shape="exclamation-triangle"></clr-icon>
              <clr-icon *ngSwitchDefault class="alert-icon" shape="check-circle"></clr-icon>
            </div>
          </ng-container>
          <div class="alert-text">{{ alertMessage }}</div>
        </div>
      </div>
      <button type="button" class="close" aria-label="Close" (click)="hideAlert.emit({})">
          <clr-icon aria-hidden="true" shape="close"></clr-icon>
      </button>
    </div>
  `,
  styles: [
    `
       .action-alert {
          z-index: 9999;
        }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppAlertComponent {
  @Input() alertMessage: string;
  @Input() showIcon = false;
  @Output() hideAlert = new EventEmitter<object>();
  @Input() icon: string;
  @Input() alertType = 'alert-success';
  // tslint:disable-next-line: variable-name
  private _isAppLevel = false;
  @Input() set isAppLevel(value: boolean) {
    this._isAppLevel = value;
    this._alertTypeClass.next(`alert ${this.isAppLevel ? 'alert-app-level action-alert' : ''} ${this.alertType}`);
  }
  get isAppLevel() {
    return this._isAppLevel;
  }
  // tslint:disable-next-line: no-inferrable-types
  @Input() showCloseActionButton: boolean = false;

  // tslint:disable-next-line: variable-name
  private _alertTypeClass = createSubject<string>();
  public get alertTypeClass$() {
    return this._alertTypeClass.asObservable();
  }
}
