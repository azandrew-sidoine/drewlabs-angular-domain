import {
  GenericSerializaleSerializer,
  UndecoratedSerializer,
} from "../../../../built-value/core/js/serializer";
import { ControlInterface } from "../compact";

export class Control implements ControlInterface {
  id!: number;
  formId!: number;
  formFormControlId!: number;
  label!: string;
  placeholder!: string;
  type!: string;
  classes!: string;
  required!: number;
  disabled!: number;
  readonly!: number;
  unique!: number;
  pattern!: string;
  description!: string;
  maxLength!: number;
  minLength!: number;
  min!: number;
  max!: number;
  minDate!: string;
  maxDate!: string;
  selectableValues!: string;
  selectableModel!: string;
  modelFilters!: string;
  multiple!: number;
  controlGroupKey!: string;
  controlName!: string;
  controlIndex!: number;
  options!: object[];
  rows!: number;
  columns!: number;
  value!: string;
  requiredIf!: string;
  uploadURL!: string;
  isRepeatable!: number;
  children!: ControlInterface[];
  uniqueOn!: string;
  dynamicControlContainerClass!: string;
  valuefield!: string;
  groupfield!: string;
  keyfield!: string;

  static builder = () =>
    new GenericSerializaleSerializer(Control, new UndecoratedSerializer());

  public static getJsonableProperties(): {
    [index: string]: keyof Control | { name: string; type: any };
  } {
    return {
      id: "id",
      formId: "formId",
      formFormControlId: "formFormControlId",
      label: "label",
      placeholder: "placeholder",
      type: "type",
      classes: "classes",
      required: "required",
      disabled: "disabled",
      readonly: "readonly",
      unique: "unique",
      pattern: "pattern",
      description: "description",
      maxLength: "maxLength",
      minLength: "minLength",
      min: "min",
      max: "max",
      minDate: "minDate",
      maxDate: "maxDate",
      selectableValues: "selectableValues",
      selectableModel: "selectableModel",
      multiple: "multiple",
      controlGroupKey: "controlGroupKey",
      controlName: "controlName",
      controlIndex: "controlIndex",
      options: "options",
      rows: "rows",
      columns: "columns",
      value: "value",
      requiredIf: "requiredIf",
      uploadURL: "uploadURL",
      isRepeatable: "isRepeatable",
      children: { name: "children", type: Control },
      uniqueOn: "uniqueOn",
      containerClass: "dynamicControlContainerClass",
      valuefield: "valuefield",
      groupfield: "groupfield",
      keyfield: "keyfield",
    };
  }
}

export class ControlRequest {
  label!: string;
  placeholder!: string;
  type!: string;
  classes!: string;
  description!: string;
  maxLength!: number;
  minLength!: number;
  min!: number;
  max!: number;
  minDate!: string;
  maxDate!: string;
  selectableValues!: string;
  selectableModel!: string;
  modelFilters!: string;
  multiple!: boolean;
  columns!: number;
  rows!: number;

  static builder() {
    return new GenericSerializaleSerializer(
      ControlRequest,
      new UndecoratedSerializer()
    );
  }

  public static getJsonableProperties(): {
    [prop: string]: keyof ControlRequest;
  } {
    return {
      label: "label",
      placeholder: "placeholder",
      type: "type",
      classes: "classes",
      description: "description",
      max_length: "maxLength",
      min_length: "minLength",
      min: "min",
      max: "max",
      min_date: "minDate",
      max_date: "maxDate",
      selectable_values: "selectableValues",
      selectable_model: "selectableModel",
      model_filters: "modelFilters",
      multiple: "multiple",
      columns: "columns",
      rows: "rows",
    };
  }

  public toSerialize(): { [prop: string]: any } {
    const serialized: { [index: string]: any } = {};
    Object.entries(ControlRequest.getJsonableProperties()).forEach(
      ([key, value]) => {
        serialized[key] = this[value];
      }
    );
    return serialized;
  }
}

export class FormControlRequest {
  formId!: number;
  formControlId!: number;
  controlName!: string;
  groupID!: number | string;
  index!: number;
  value!: string | number;
  required!: boolean;
  disabled!: boolean;
  readOnly!: boolean;
  unique!: boolean;
  pattern!: string;
  requiredIf!: string;
  uploadUrl!: string;
  repeatable!: boolean;
  uniqueOn!: string;
  containerClass!: string;

  static builder() {
    return new GenericSerializaleSerializer(
      FormControlRequest,
      new UndecoratedSerializer()
    );
  }

  public static getJsonableProperties(): {
    [prop: string]: keyof FormControlRequest;
  } {
    return {
      form_id: "formId",
      form_control_id: "formControlId",
      control_name: "controlName",
      group_id: "groupID",
      index: "index",
      value: "value",
      required: "required",
      disabled: "disabled",
      read_only: "readOnly",
      unique: "unique",
      pattern: "pattern",
      required_if: "requiredIf",
      upload_url: "uploadUrl",
      repeatable: "repeatable",
      unique_on: "uniqueOn",
      container_class: "containerClass",
    };
  }

  public toSerialize(): { [prop: string]: any } {
    const serialized: { [index: string]: any } = {};
    Object.entries(FormControlRequest.getJsonableProperties()).forEach(
      ([key, value]) => {
        serialized[key] = this[value];
      }
    );
    return serialized;
  }
}

export const createSerializedControlRequest = (value: any) =>
  new GenericSerializaleSerializer(ControlRequest)
    .fromSerialized(value)
    .toSerialize() as { [index: string]: any };

export const createSerializedFormControlRequest = (value: any) =>
  new GenericSerializaleSerializer(FormControlRequest)
    .fromSerialized(value)
    .toSerialize() as { [index: string]: any };
