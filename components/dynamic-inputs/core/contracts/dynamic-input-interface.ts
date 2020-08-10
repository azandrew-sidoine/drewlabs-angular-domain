import { IHTMLFormControlValidationRule } from './input-rules';

export interface HTMLFormControlRequireIfConfig {
  formControlName: string;
  values: any[];
}

/**
 * @description Base interface definition for an HTML form control configuration values
 */
export interface IHTMLFormControl {
  label: string;
  type: string;
  formControlName: string;
  classes: string;
  requiredIf?: HTMLFormControlRequireIfConfig;
  items?: Array<any>;
  rules?: IHTMLFormControlValidationRule;
  placeholder?: string;
  value?: string|any;
  disabled?: boolean;
  readOnly?: boolean;
  descriptionText?: string;
  formControlGroupKey?: string;
  formControlIndex?: number;
  // Added this control to show or hide an element on the view
  hidden?: boolean;
  isRepeatable: boolean;
  uniqueCondition?: string;
  containerClass: string;
}
