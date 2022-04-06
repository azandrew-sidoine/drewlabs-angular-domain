import { Injectable } from "@angular/core";
import { AbstractControl, FormBuilder } from "@angular/forms";
import { isArray } from "../../../../utils";
import { IDynamicForm, InputInterface } from "../../core";
import { ComponentReactiveFormHelpers } from "../helpers";
import { AngularReactiveFormBuilderBridge } from "../types";

@Injectable()
export class ReactiveFormBuilderBrige
  implements AngularReactiveFormBuilderBridge
{
  // Creates and instance of the Angular reactive form bridge
  constructor(public readonly builder: FormBuilder) {}

  group(source: IDynamicForm | InputInterface[]): AbstractControl {
    if (source) {
      const source_ = !isArray(source)
        ? [...((source as IDynamicForm).controlConfigs as InputInterface[])]
        : (source as InputInterface[]);
      return ComponentReactiveFormHelpers.buildFormGroupFromInputConfig(
        this.builder,
        source_
      );
    }
    return this.builder.group({});
  }
}
