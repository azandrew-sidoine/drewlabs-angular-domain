import { IHTMLFormControl } from "../../core/contracts/dynamic-input";
import { IDynamicForm } from "../../core/contracts/dynamic-form";
import { includes, toNumber, isNumber } from "lodash";
import { AbstractControl } from "@angular/forms";
import {
  ApplyAttributeChangesToControlsCallback,
  BindingInterface,
  ControlBindings,
} from "../types";
import { ComponentReactiveFormHelpers } from "./reactive-form-helpers";

export const applyHiddenAttributeCallback =
  (form: IDynamicForm, bidings: BindingInterface, value: string | number) =>
  (formgroup: AbstractControl) => {
    const hasControls =
      Array.isArray(form.controlConfigs) && form.controlConfigs.length !== 0;
    if (hasControls) {
      form.controlConfigs = (form.controlConfigs as IHTMLFormControl[]).map(
        (_control) => {
          if (_control.formControlName === bidings.key) {
            value = isNaN(value as any) ? value : toNumber(value);
            const requiredIfValues = isNumber(value)
              ? _control.requiredIf
                ? _control.requiredIf.values.map((item) => {
                    return isNaN(item) ? item : toNumber(item);
                  })
                : []
              : _control.requiredIf?.values || [];
            _control.hidden = !includes(requiredIfValues, value) ? true : false;
            if (_control.hidden) {
              formgroup.get(bidings.key)?.setValue(null);
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
        }
      );
    }
    return { control: formgroup, form };
  };

// tslint:disable-next-line: typedef
export const getControlBinding =
  (form: IDynamicForm) => (formgroup: AbstractControl) => {
    const bindings = {} as ControlBindings;
    const canApplyBindings =
      Array.isArray(form.controlConfigs) &&
      form.controlConfigs.length !== 0 &&
      formgroup;
    if (canApplyBindings) {
      (form.controlConfigs as IHTMLFormControl[]).forEach((config) => {
        const { requiredIf, formControlName } = config;
        const control_ = formgroup.get(formControlName);
        if (requiredIf) {
          bindings[formControlName] = {
            key: formControlName,
            binding: requiredIf,
            validators: control_?.validator ?? undefined,
            asyncValidators: control_?.asyncValidator ?? undefined,
          };
        }
      });
      for (const value of Object.values(bindings)) {
        const binding = value.binding ?? undefined;
        const hasControl = binding
          ? false !== (formgroup.get(binding.formControlName) ?? false)
          : false;
        const controlValue = value.binding
          ? formgroup.get(value.binding?.formControlName)?.value
          : undefined;
        if (binding && hasControl) {
          const { control, dynamicForm } = applyAttribute(
            form,
            value,
            controlValue,
            applyHiddenAttributeCallback
          )(formgroup);
          formgroup = control;
          form = dynamicForm;
        }
      }
    }
    return { bindings, formgroup, form };
  };

// tslint:disable-next-line: typedef
export const applyAttribute =
  (
    param: IDynamicForm,
    bindings: BindingInterface,
    value: string | number,
    callback: ApplyAttributeChangesToControlsCallback
  ) =>
  (formgroup: AbstractControl) => {
    // Calls the update method here
    const { control, form } = callback(param, bindings, value)(formgroup);
    return { control: control, dynamicForm: form };
  };
