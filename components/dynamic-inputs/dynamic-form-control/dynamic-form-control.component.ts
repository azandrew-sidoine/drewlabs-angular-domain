import {
  IHTMLFormControl,
  InputTypes
} from '../core';
import { FormGroup } from '@angular/forms';
import { AbstractControl } from '@angular/forms';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  OnInit
} from '@angular/core';
import { createSubject } from '../../../rxjs/helpers';
import { takeUntil } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { CheckboxItem, ISelectItem, RadioItem } from '../core/contracts/control-item';

export interface FileFormControl {
  uuid: string;
  dataURL: string;
  extension?: string;
  type?: string;
}
@Component({
  selector: 'app-dynamic-inputs',
  templateUrl: './dynamic-form-control.component.html',
  styleUrls: ['./dynamic-form-control.component.css'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicFormControlComponent implements OnDestroy, OnInit {

  @Input() listenForChanges: boolean;
  // tslint:disable-next-line: variable-name
  @Input() control:AbstractControl;
  @Input() showLabelAndDescription = true;
  // tslint:disable-next-line: variable-name
  @Input() inputConfig: IHTMLFormControl;
  @Input() listItems:
    | Observable<Array<ISelectItem | CheckboxItem | RadioItem>>
    | Array<ISelectItem | CheckboxItem | RadioItem>;

  public inputTypes = InputTypes;
  // String representation of today
  public formArrayGroup: FormGroup;

  @Output() fileAdded = new EventEmitter<any>();
  @Output() fileRemoved = new EventEmitter<any>();
  @Output() inputKeyUp = new EventEmitter<{ formcontrolname: string, value: any }>();
  @Output() inputKeyDown = new EventEmitter<{ formcontrolname: string, value: any }>();
  @Output() inputKeypress = new EventEmitter<{ formcontrolname: string, value: any }>();
  @Output() inputBlur = new EventEmitter<{ formcontrolname: string, value: any }>();
  @Output() inputFocus = new EventEmitter<{ formcontrolname: string, value: any }>();
  @Output() inputSelect = new EventEmitter<{ formcontrolname: string, value: any }>();
  @Output() valueChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() multiSelectItemRemove = new EventEmitter<any>();

  private destroy$ = createSubject<boolean>();

  ngOnInit(): void {
    if (this.listenForChanges) {
      this.control?.valueChanges
        .pipe(
          takeUntil(this.destroy$)
        )
        .subscribe((source) => this.valueChange.emit(source));
    }
  }

  ngOnDestroy = () => {
    this.destroy$.next(true);
  }
}
