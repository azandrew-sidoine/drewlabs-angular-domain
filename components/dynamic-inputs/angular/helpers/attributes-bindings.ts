import { IHTMLFormControl } from '../../core/contracts/dynamic-input';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { BindingInterface } from '../types';
import { ComponentReactiveFormHelpers } from './reactive-form-helpers';
import { isNumber } from '../../../../utils';

type CreateControlAttributeSetterReturnType = (
  formgroup: AbstractControl
) => [AbstractControl, IHTMLFormControl[]];

type CreateControlAttributeSetterType = (
  controls: IHTMLFormControl[],
  bindings: BindingInterface,
  value: any
) => CreateControlAttributeSetterReturnType;

export function createHiddenAttributeSetter(
  controls: IHTMLFormControl[],
  bidings: BindingInterface,
  value: string | number
): CreateControlAttributeSetterReturnType {
  return (formgroup: AbstractControl) => {
    const hasControls = Array.isArray(controls) && controls.length !== 0;
    if (hasControls) {
      controls = controls.map((_control) => {
        if (_control.formControlName === bidings.key) {
          value = isNaN(value as any) ? value : +value;
          const requiredIfValues = isNumber(value)
            ? _control.requiredIf
              ? _control.requiredIf.values.map((item) => {
                  return isNaN(item) ? item : +item;
                })
              : []
            : _control.requiredIf?.values || [];
          _control.hidden = !requiredIfValues.includes(value) ? true : false;
          if (_control.hidden) {
            const current = formgroup.get(bidings.key);
            current?.reset();
            ComponentReactiveFormHelpers.clearControlValidators(
              formgroup.get(bidings.key) || undefined
            );
            ComponentReactiveFormHelpers.clearAsyncValidators(
              formgroup.get(bidings.key) || undefined
            );
          } else {
            formgroup
              .get(bidings.key)
              ?.setValidators(bidings.validators || null);
            formgroup
              .get(bidings.key)
              ?.setAsyncValidators(bidings.asyncValidators || null);
          }
        }
        return _control;
      });
    }
    return [formgroup, controls];
  };
}

// tslint:disable-next-line: typedef
export function controlAttributesDataBindings(controls: IHTMLFormControl[]) {
  return (formgroup: AbstractControl) => {
    const bindings: Map<string, BindingInterface> = new Map();
    if (Array.isArray(controls) && controls.length !== 0 && formgroup) {
      const mathes = controls.filter(
        (current) =>
          current.requiredIf !== null &&
          typeof current.requiredIf !== 'undefined'
      );
      for (const config of mathes) {
        const { requiredIf, formControlName } = config;
        const control_ = formgroup.get(formControlName);
        bindings.set(formControlName, {
          key: formControlName,
          binding: requiredIf,
          validators: control_?.validator ?? undefined,
          asyncValidators: control_?.asyncValidator ?? undefined,
        });
      }
      for (const value of bindings.values()) {
        const binding = value.binding ?? undefined;
        const hasControl = binding
          ? false !== (formgroup.get(binding.formControlName) ?? false)
          : false;
        const controlValue = value.binding
          ? formgroup.get(value.binding?.formControlName)?.value
          : undefined;
        if (binding && hasControl) {
          const [control, _controls] = setControlsAttributes(
            controls,
            value,
            controlValue,
            createHiddenAttributeSetter
          )(formgroup);
          formgroup = control as FormGroup;
          controls = _controls;
        }
      }
    }
    return [bindings, formgroup, controls];
  };
}

// tslint:disable-next-line: typedef
export function setControlsAttributes(
  controls: IHTMLFormControl[],
  bindings: BindingInterface,
  value: any,
  callback: CreateControlAttributeSetterType
) {
  return (formgroup: AbstractControl) =>
    callback(controls, bindings, value)(formgroup);
}
