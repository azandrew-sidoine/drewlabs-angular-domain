import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, AbstractControl, FormArray, ValidatorFn, AsyncValidator, AsyncValidatorFn, Validator } from '@angular/forms';
import { IDynamicForm } from '../../core/contracts/dynamic-form';
import { isDefined, isArray } from '../../../../utils/type-utils';
import { HTMLFormControlRequireIfConfig, IHTMLFormControl } from '../../core/contracts/dynamic-input-interface';
import { sortFormByIndex } from 'src/app/lib/domain/components/dynamic-inputs/core/contracts/form-control';
import { isGroupOfIDynamicForm, ComponentReactiveFormHelpers } from 'src/app/lib/domain/helpers/component-reactive-form-helpers';

interface IConditionalControlBinding {
  key: string;
  binding: HTMLFormControlRequireIfConfig;
  validators: ValidatorFn | ValidatorFn[];
  asyncValidators: AsyncValidatorFn | AsyncValidatorFn[];
}

export interface MultiSelectItemRemoveEvent {
  event: any;
  control: IHTMLFormControl;
}

@Component({
  selector: 'app-dynamic-form-wapper',
  templateUrl: './dynamic-form-wapper.component.html',
  styles: []
})
export class DynamicFormWapperComponent implements OnInit {

  @Input() form: IDynamicForm;
  @Input() componentFormGroup: FormGroup;
  @Output() controlItemRemoved = new EventEmitter<MultiSelectItemRemoveEvent>();
  @Output() fileAdded = new EventEmitter<any>();
  @Output() fileRemoved = new EventEmitter<any>();
  public conditionalControlBindings: { [index: string]: IConditionalControlBinding } = {};

  // Text/Type input event
  @Output() inputKeyUp = new EventEmitter<{formcontrolname: string, value: any}>();
  @Output() inputKeyDown = new EventEmitter<{formcontrolname: string, value: any}>();
  @Output() inputKeypress = new EventEmitter<{formcontrolname: string, value: any}>();
  @Output() inputBlur = new EventEmitter<{formcontrolname: string, value: any}>();

  constructor() { }

  ngOnInit() {
    this.form = sortFormByIndex(this.form);
    if (this.isFormGroup(this.form)) {
      this.form.forms.forEach((v) => {
        this.buildConditionalControlBindings(v);
      });
    } else {
      this.buildConditionalControlBindings(this.form);
    }
  }

  buildConditionalControlBindings(v: IDynamicForm) {
    if (isDefined(v.controlConfigs) && ((v.controlConfigs as Array<IHTMLFormControl>).length > 0)) {
      (v.controlConfigs as Array<IHTMLFormControl>).forEach((c) => {
        if (isDefined(c.requiredIf)) {
          this.conditionalControlBindings[c.formControlName] = {
            key: c.formControlName,
            binding: c.requiredIf,
            validators: this.componentFormGroup.get(c.formControlName).validator,
            asyncValidators: this.componentFormGroup.get(c.formControlName).asyncValidator,
          };
        }
      });
      for (const [k, value] of Object.entries(this.conditionalControlBindings)) {
        if (isDefined(this.componentFormGroup.get(value.binding.formControlName))) {
          this.applyHiddenOnMatchingControls(value,
            this.componentFormGroup.get(value.binding.formControlName).value,
            this.updateControlHiddenValue.bind(this));
        }
      }
    }
  }

  shouldListenforChange(controlName: string) {
    if (isDefined(
      Object.values(this.conditionalControlBindings).find((o, i) => {
        return o.binding.formControlName === controlName;
      })
    )) {
      return true;
    }
    return false;
  }

  handleControlChanges(event: any) {
    const filteredConfigs = Object.values(this.conditionalControlBindings).filter((o) => {
      return o.binding.formControlName.toString() === event.controlName.toString();
    });
    if (isArray(filteredConfigs)) {
      filteredConfigs.forEach((item) => {
        this.applyHiddenOnMatchingControls(item, event.event, this.updateControlHiddenValue.bind(this));
      });
    }
  }

  applyHiddenOnMatchingControls(
    bindings: IConditionalControlBinding,
    value: string | number,
    fn: (f: IDynamicForm, c: IConditionalControlBinding, s: string | number) => void) {
    if (this.isFormGroup(this.form)) {
      this.form.forms.forEach((v) => {
        // Call the update method here
        fn(v, bindings, value);
      });
    } else {
      // Calls the update method here
      fn(this.form, bindings, value);
    }
  }

  updateControlHiddenValue(v: IDynamicForm, conditionBindings: IConditionalControlBinding, value: string | number) {
    if (isDefined(v.controlConfigs) && ((v.controlConfigs as Array<IHTMLFormControl>).length > 0)) {
      (v.controlConfigs as Array<IHTMLFormControl>).forEach((c) => {
        if (c.formControlName === conditionBindings.key) {
          c.hidden = c.requiredIf.values.indexOf(isDefined(value) ? value.toString() : value) === - 1 ? true : false;
          if (c.hidden) {
            this.componentFormGroup.get(conditionBindings.key).setValue(null);
            ComponentReactiveFormHelpers.clearControlValidators(this.componentFormGroup.get(conditionBindings.key));
            ComponentReactiveFormHelpers.clearAsyncValidators(this.componentFormGroup.get(conditionBindings.key));
          } else {
            this.componentFormGroup.get(conditionBindings.key).setValidators(conditionBindings.validators);
            this.componentFormGroup.get(conditionBindings.key).setAsyncValidators(conditionBindings.asyncValidators);
          }
          return;
        }
      });
    }
  }

  isFormGroup(f: IDynamicForm) {
    return isGroupOfIDynamicForm(f);
  }

  asFormArray(control: AbstractControl, index: number): FormArray {
    return control as FormArray;
  }

  asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  isDefined(value: any) {
    return isDefined(value);
  }

  asArray(value: any) {
    return value as Array<any>;
  }

  rebuilListItems(values: any[]): any[] {
    if (isDefined(values)) {
      return [...values];
    }
    return values;
  }
}
