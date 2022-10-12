import { ControlInterface } from '../compact/types';
import { InputInterface, InputValidationRule } from '../types';
import { buildRequiredIfConfig } from '../helpers/builders';
export interface NumberInput extends InputInterface {
  min: number;
  max?: number;
}

/**
 * Creates an instance {@see NumberInput} interface
 *
 * @param source
 */
export function buildNumberInput(source: Partial<ControlInterface>) {
  return {
    label: source.label,
    type: source.type,
    formControlName: source.controlName,
    value: source.value,
    classes: source.classes,
    uniqueCondition: source.uniqueOn,
    isRepeatable: Boolean(source.isRepeatable),
    containerClass: source.dynamicControlContainerClass,
    requiredIf: source.requiredIf
      ? buildRequiredIfConfig(source.requiredIf)
      : undefined,
    formControlIndex: source.controlIndex,
    formControlGroupKey: source.controlGroupKey,
    rules: {
      isRequired: Boolean(source.required),
      max: Boolean(source.max),
      min: Boolean(source.min),
    } as InputValidationRule,
    placeholder: source.placeholder,
    disabled: Boolean(source.disabled),
    readOnly: Boolean(source.readonly),
    descriptionText: source.description,
    min: source.min,
    max: source.max,
  } as NumberInput;
}