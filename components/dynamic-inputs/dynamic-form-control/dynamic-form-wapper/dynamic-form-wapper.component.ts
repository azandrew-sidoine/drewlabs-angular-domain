import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from "@angular/core";
import { FormGroup, AbstractControl, FormArray } from "@angular/forms";
import { IDynamicForm } from "../../core/contracts/dynamic-form";
import { isDefined, isArray } from "../../../../utils";
import { sortDynamicFormByIndex } from "../../core/helpers";
import {
  IConditionalControlBinding,
  MultiSelectItemRemoveEvent,
} from "./types";
import { createStateful } from "../../../../rxjs/helpers/creator-functions";
import { isGroupOfIDynamicForm } from "../../../../helpers/component-reactive-form-helpers";
import { DynamicForm } from "../../core/dynamic-form";
import { isEmpty } from "lodash";
import {
  applyAttribute,
  applyHiddenAttributeCallback,
  getControlBinding,
} from "./helpers";

type UndefinedDynamicForm = IDynamicForm | undefined;
type UndefinedFormGroup = AbstractControl | undefined;

@Component({
  selector: "app-dynamic-form-wapper",
  templateUrl: "./dynamic-form-wapper.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormWapperComponent {
  @Input() _form!: IDynamicForm;
  get form() {
    return this._form;
  }
  // tslint:disable-next-line: variable-name
  @Input() set form(value: any) {
    const { form, formgroup } = this.setComponentForm(
      value,
      this._componentFormGroup
    );
    this._form = form as IDynamicForm;
    this._componentFormGroup = formgroup as FormGroup;
  }
  _componentFormGroup!: FormGroup;
  @Input() set componentFormGroup(value: FormGroup) {
    const { form, formgroup } = this.setComponentForm(this._form, value);
    this._form = form as IDynamicForm;
    this._componentFormGroup = formgroup as FormGroup;
  }
  get componentFormGroup() {
    return this._componentFormGroup;
  }

  @Output() controlItemRemoved = new EventEmitter<MultiSelectItemRemoveEvent>();
  @Output() fileAdded = new EventEmitter<any>();
  @Output() fileRemoved = new EventEmitter<any>();

  // Text/Type input event
  @Output() inputKeyUp = new EventEmitter<{
    formcontrolname: string;
    value: any;
  }>();
  @Output() inputKeyDown = new EventEmitter<{
    formcontrolname: string;
    value: any;
  }>();
  @Output() inputKeypress = new EventEmitter<{
    formcontrolname: string;
    value: any;
  }>();
  @Output() inputBlur = new EventEmitter<{
    formcontrolname: string;
    value: any;
  }>();

  @Input() singleColumnControl = false;
  @Input() controlContainerClass = "clr-col-12";

  private _bindings$ = createStateful<{
    [index: string]: IConditionalControlBinding;
  }>({});
  get bindings$() {
    return this._bindings$.asObservable();
  }

  // tslint:disable-next-line: typedef
  setComponentForm(value: UndefinedDynamicForm, control?: UndefinedFormGroup) {
    let _bindings = this._bindings$.getValue();
    if (
      value &&
      isGroupOfIDynamicForm(value) &&
      control &&
      isEmpty(_bindings)
    ) {
      let _form = sortDynamicFormByIndex(new DynamicForm(value));
      let _formgroup = control;
      _form.forms = _form.forms?.map((v) => {
        const { bindings, form, formgroup } = getControlBinding(v)(_formgroup);
        _formgroup = formgroup as FormGroup;
        _bindings = { ...(_bindings || {}), ...bindings };
        return form;
      });
      this._bindings$.next({ ..._bindings });
      return { form: _form, formgroup: _formgroup };
    } else if (value && control && isEmpty(_bindings)) {
      let _form = sortDynamicFormByIndex(new DynamicForm(value));
      const { bindings, form, formgroup } = getControlBinding(_form)(control);
      this._bindings$.next({ ..._bindings, ...bindings });
      return { form, formgroup };
    }
    return { form: value, formgroup: control };
  }

  // tslint:disable-next-line: typedef
  shouldListenforChange(
    controlName: string,
    bindings: { [prop: string]: IConditionalControlBinding }
  ) {
    return isDefined(
      Object.values(bindings).find((o, i) => {
        return o.binding.formControlName === controlName;
      })
    )
      ? true
      : false;
  }

  // tslint:disable-next-line: typedef
  handleControlChanges(
    event: any,
    bindings: { [prop: string]: IConditionalControlBinding }
  ) {
    const filteredConfigs = Object.values(bindings).filter((o) => {
      return (
        o.binding.formControlName.toString() === event.controlName.toString()
      );
    });
    if (isArray(filteredConfigs)) {
      filteredConfigs.forEach((item) => {
        const { control, dynamicForm } = applyAttribute(
          this._form,
          item,
          event.event,
          applyHiddenAttributeCallback
        )(this.componentFormGroup);
        this.componentFormGroup = control as FormGroup;
        this._form = dynamicForm;
      });
    }
  }

  getControlContainerClass(clazz: string): string {
    if (this.singleColumnControl) {
      return this.controlContainerClass;
    }
    return isDefined(clazz) ? clazz : this.controlContainerClass;
  }

  // tslint:disable-next-line: typedef
  isFormGroup(f: IDynamicForm) {
    return isGroupOfIDynamicForm(f);
  }

  asFormArray(control: AbstractControl, index: number): FormArray {
    return control as FormArray;
  }

  asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }
  // tslint:disable-next-line: typedef
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
