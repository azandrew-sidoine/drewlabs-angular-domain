import {
  AbstractControl,
  FormBuilder,
  Validators,
  FormArray,
  FormGroup
} from '@angular/forms';
import {
  InputTypes,
  CheckBoxInput,
  CheckboxItem,
  TextInput,
  DateInput,
  IHTMLFormControl,
  NumberInput,
  IDynamicForm,
  DynamicForm,
} from 'src/app/lib/domain/components/dynamic-inputs/core';
import { of } from 'rxjs';
import { CustomValidators } from 'src/app/lib/domain/utils/custom-validators';
import { Form } from 'src/app/lib/domain/components/dynamic-inputs/core/form-control/form';
import { isDefined, isArray } from 'src/app/lib/domain/utils/type-utils';
import { AppUIStoreManager } from './app-ui-store-manager.service';
import { EventEmitter, HostBinding } from '@angular/core';
import { AbstractAlertableComponent } from './component-interfaces';
import { TranslationService } from '../translator';
import { ICollection } from '../contracts/collection-interface';

/**
 * @description Checks if a dynamic form contains other form
 * @param f [[IDynamicForm]]
 */
export function isGroupOfIDynamicForm(f: IDynamicForm) {
  if (isDefined(f) && isDefined(f.forms)) {
    return true;
  }
  return false;
}

/**
 * @description Defines an object passed to the form submission event
 */
export interface FormRequest {
  body: object;
  requestURL?: string;
}

/**
 * @description Interface definition of a form submission event with the request url
 */
export interface InnerFormSubmissionEvent {
  index: number;
  requestURL?: string;
}

/**
 * @description Build an angular form group from a dynamic form instance
 * @param builder [[FormBuilder]]
 * @param form [[IDynamicForm]]
 * @param applyRequiredRules [[boolean]]
 */
export function angularAbstractControlFormDynamicForm(
  builder: FormBuilder,
  form: IDynamicForm,
  applyRequiredRules: boolean = true
): AbstractControl {
  if (!isDefined(form)) {
    return null;
  }
  const c = [...form.controlConfigs];
  if (isGroupOfIDynamicForm(form)) {
    (form as IDynamicForm).forms.forEach((v) => {
      c.push(...(v.controlConfigs ? v.controlConfigs : []));
    });
  }
  const formGroup: FormGroup = (ComponentReactiveFormHelpers.buildFormGroupFromInputConfig(
    builder,
    c,
    applyRequiredRules
  ) as FormGroup);
  return formGroup;
}

/**
 * @description Build a formgroup from a collection of dynamic inputs
 * @param builder [[FormBuilder]]
 * @param collection [[ICollection<IDynamicForm>]]
 */
export function formGroupFromCollectionOfDynamicControls(builder: FormBuilder, collection: ICollection<IDynamicForm>) {
  const group = builder.group({});
  collection.keys().forEach((k) => {
    group.addControl(k,
      angularAbstractControlFormDynamicForm(builder, collection.get(k))
    );
  });
  return group;
}
export class ComponentReactiveFormHelpers {
  /**
   * Generate an abstract form control using input configuration
   * @param fb [[FormBuilder]] Angular forms reactive formbuilder
   * @param input [[DynamicInput]] dynamic input configuration
   */
  public static buildFormGroupFromInputConfig(
    fb: FormBuilder,
    input: IHTMLFormControl[],
    applyRequiredRules: boolean = true
  ): AbstractControl {
    const group = fb.group({});
    input.map((config: IHTMLFormControl) => {
      if (config.type !== InputTypes.CHECKBOX_INPUT) {
        const validators = [
          config.rules && config.rules.isRequired && applyRequiredRules ? Validators.required : Validators.nullValidator
        ];
        if (
          config.type === InputTypes.TEXT_INPUT ||
          config.type === InputTypes.EMAIL_INPUT ||
          config.type === InputTypes.PASSWORD_INPUT
        ) {
          // Checks if maxlength rule is set to true and apply the rule to the input
          config.rules && config.rules.maxLength
            ? validators.push(
              Validators.maxLength(
                isDefined((config as TextInput).maxLength)
                  ? (config as TextInput).maxLength
                  : 255
              )
            )
            : // tslint:disable-next-line:no-unused-expression
            null,
            // Checks if maxlength rule is set to true and apply the rule to the input
            config.rules && config.rules.minLength
              ? validators.push(
                Validators.minLength(
                  isDefined((config as TextInput).minLength)
                    ? (config as TextInput).minLength
                    : 255
                )
              )
              : // tslint:disable-next-line:no-unused-expression
              null;
          // TODO Email input can sometimes not be a text input
          config.rules && config.rules.email
            ? validators.push(Validators.email)
            : // tslint:disable-next-line:no-unused-expression
            null;
          config.rules && config.rules.pattern
            ? validators.push(Validators.pattern((config as TextInput).pattern))
            : // tslint:disable-next-line:no-unused-expression
            null;
        }
        // Check for min an max rules on number inputs and apply validation to the input
        if (config.type === InputTypes.NUMBER_INPUT) {
          config.rules && config.rules.min
            ? validators.push(
              Validators.min(
                isDefined((config as NumberInput).min)
                  ? (config as NumberInput).min
                  : 0
              )
            )
            : // tslint:disable-next-line:no-unused-expression
            null,
            // Checks if maxlength rule is set to true and apply the rule to the input
            config.rules && config.rules.min
              ? validators.push(
                Validators.minLength(
                  isDefined((config as NumberInput).max)
                    ? (config as NumberInput).max
                    : (Math.pow(2, 31) - 1)
                )
              )
              : // tslint:disable-next-line:no-unused-expression
              null;
        }
        // Validation rules form date input
        if (config.type === InputTypes.DATE_INPUT) {
          config.rules && config.rules.minDate
            ? validators.push(
              CustomValidators.minDate(
                isDefined((config as DateInput).minDate)
                  ? (config as DateInput).minDate
                  : new Date()
              )
            )
            : // tslint:disable-next-line:no-unused-expression
            null,
            // Checks if maxlength rule is set to true and apply the rule to the input
            config.rules && config.rules.min
              ? validators.push(
                CustomValidators.maxDate(
                  isDefined((config as DateInput).maxDate)
                    ? (config as DateInput).maxDate
                    : new Date()
                )
              )
              : // tslint:disable-next-line:no-unused-expression
              null;
        }
        // Add formControl to the form group with the generated validation rules
        group.addControl(
          config.formControlName,
          fb.control(
            { value: config.value, disabled: config.disabled },
            Validators.compose(validators)
          )
          // Add other necessary validators
        );
      } else {
        // Build list of checkboxes
        const array: FormArray = new FormArray([]);
        of((config as CheckBoxInput).items).subscribe(items => {
          items.map((it: CheckboxItem, index: number) => {
            // Added validation rule to checkbox array
            (array as FormArray).push(fb.control(it.checked));
          });
        });
        // Add FormArray control to the formGroup
        if (config.rules && config.rules.isRequired && applyRequiredRules) {
          array.setValidators(Validators.required);
        }
        group.addControl(config.formControlName, array);
      }
    });
    return group;
  }

  /**
   * Loop through formGroup controls and mark them as touched
   * @param formGroup [[FormGroup]] Reference to component formGroup object
   */
  public static validateFormGroupFields(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((field: string) => {
      if (formGroup.get(field) instanceof FormGroup) {
        ComponentReactiveFormHelpers.validateFormGroupFields(formGroup.get(field) as FormGroup);
      } else {
        ComponentReactiveFormHelpers.markControlAsTouched(formGroup.get(field));
      }
    });
  }
  /**
   * Mark control as touched them as touched
   * @param formGroup [[AbstractControl]] reference to form control
   */
  public static markControlAsTouched(control: AbstractControl): void {
    control.markAsTouched({ onlySelf: true });
  }
}


export class TranslationHelpers {
  static translatableValuePrefixs: string[] = ['translations.', '__.'];

  /**
   * @description Checks if the string should be translated or not
   */
  public static shouldBetranslated(value: string): boolean {
    return (new RegExp(TranslationHelpers.translatableValuePrefixs.join('|')).test(value));
  }

  /**
   * @description Removes the translation part from the translation label
   * @param value [[string]]
   */
  public static trimtranslatableValue(value: string) {
    if (value.startsWith(TranslationHelpers.translatableValuePrefixs[0])) {
      return value.substring(TranslationHelpers.translatableValuePrefixs[0].length);
    }
    if (value.startsWith(TranslationHelpers.translatableValuePrefixs[1])) {
      return value.substring(TranslationHelpers.translatableValuePrefixs[1].length);
    }
    return value;
  }
}

function parseForms() {

}


export class DynamicFormHelpers {
  /**
   * @description Create an instance of [[IDynamicForm]] from a [[Form]] instance
   * The method tries to translate prossible translatable label
   * @param form [[Form]]
   * @param translate [[TranslatorService]]
   */
  public static async buildDynamicForm(form: Form, translate: TranslationService) {
    const configGeneratorFn = async (f: Form, t: TranslationService) => {
      let configs: IHTMLFormControl[] = [];
      const translatables: string[] = [];
      let translations: any[];
      if (TranslationHelpers.shouldBetranslated(f.title)) {
        f.title = f.title ? `${TranslationHelpers.trimtranslatableValue(f.title)}` : null;
        f.description = f.description ? `${TranslationHelpers.trimtranslatableValue(f.description)}` : null;
        if (f.title) {
          translatables.push(f.title);
        }
        if (f.description) {
          translatables.push(f.description);
        }
      }
      if (isArray(f.formControls) && (f.formControls.length > 0)) {
        f.formControls.forEach((control) => {
          if (TranslationHelpers.shouldBetranslated(control.label)) {
            control.label = control.label ? `${TranslationHelpers.trimtranslatableValue(control.label)}` : null;
            if (control.label) {
              translatables.push(TranslationHelpers.trimtranslatableValue(control.label));
            }
          }
          if (TranslationHelpers.shouldBetranslated(control.description)) {
            control.description = control.description ? `${TranslationHelpers.trimtranslatableValue(control.description)}` : null;
            if (control.description) {
              translatables.push(TranslationHelpers.trimtranslatableValue(control.description));
            }
          }
          if (TranslationHelpers.shouldBetranslated(control.placeholder)) {
            control.placeholder = control.placeholder ? `${TranslationHelpers.trimtranslatableValue(control.placeholder)}` : null;
            if (control.placeholder) {
              translatables.push(TranslationHelpers.trimtranslatableValue(control.placeholder));
            }
          }
        });
      }
      if (translatables.length > 0) {
        translations = await t.translate(translatables).toPromise();
      }
      if (isArray(f.formControls) && (f.formControls.length > 0)) {
        configs = f.formControls.map((control) => {
          // Update the control label, description and placeholder values
          const config = control.toDynamicControl();
          // tslint:disable-next-line: max-line-length
          return Object.assign(config, {
            label: translations ? translations[control.label] : control.label,
            descriptionText: translations ? translations[control.description] : control.description,
            placeholder: translations ? translations[control.placeholder] : control.placeholder
          });
        });
      }
      let forms = null;
      if (f.children && f.children.length) {
        forms = await Promise.all(f.children.map(async (value) => {
          return await configGeneratorFn(value, translate);
        }));
      }
      return new DynamicForm({
        title: translations ? translations[f.title] : f.title,
        description: translations ? translations[f.description] : f.description,
        endpointURL: f.url,
        controlConfigs: configs,
        forms
      });

    };
    const buildedForm = await configGeneratorFn(form, translate);
    return buildedForm;
  }
}

/**
 * @description This class provides components that extends from it with helper methods
 * for handling form submission, form validation, and form generations
 */
export abstract class BaseDynamicFormComponent extends AbstractAlertableComponent {
  public componentFormGroup: FormGroup;
  public form: IDynamicForm;
  public formSubmitted: EventEmitter<object> = new EventEmitter<object>();
  public cancelSubmission: EventEmitter<boolean> = new EventEmitter<boolean>();

  /**
   * @description Component object instance initializer
   * @param builder [[FormBuilder]] Angular ReactiveForm FormBuilder
   * @param appUIStoreManager [[AppUIStoreManager]]
   */
  constructor(
    protected builder: FormBuilder,
    public appUIStoreManager: AppUIStoreManager
  ) {
    super(appUIStoreManager);
  }

  /**
   * @description Build an angular [[AbstractControl]] instance from dynamic form configurations
   */
  buildForm(applyRequiredRules: boolean = true): AbstractControl {
    if (!isDefined(this.form)) {
      return null;
    }
    const c = [...this.form.controlConfigs];
    if (this.isFormGroup(this.form)) {
      (this.form as IDynamicForm).forms.forEach((v) => {
        c.push(...(v.controlConfigs ? v.controlConfigs : []));
      });
    }
    const formGroup: FormGroup = (ComponentReactiveFormHelpers.buildFormGroupFromInputConfig(
      this.builder,
      c,
      applyRequiredRules
    ) as FormGroup);
    return formGroup;
  }

  /**
   * @description Checks if the param is a FormGroup
   * @param f [[IDynamicForm]]
   */
  isFormGroup(f: IDynamicForm) {
    return isGroupOfIDynamicForm(f);
  }

  /**
   * @description Validate a form group and return it back
   * @param formgroup [[FormGroup]]
   */
  validateAndReturnFormGroup(formgroup: FormGroup) {
    // Mark componentFormGroup controls as touched
    ComponentReactiveFormHelpers.validateFormGroupFields(
      formgroup
    );
    return formgroup;
  }

  /**
   * @description Emit form submission with a given form value
   * @param formgroup [[FormGroup]]
   * @param requestURL [[string]]
   */
  submitFormGroupValue(formgroup: FormGroup, requestURL: string) {
    if (formgroup.valid) {
      // Fire formSubmitted event with the formGroup value
      this.formSubmitted.emit({ body: formgroup.getRawValue(), requestURL });
    }
  }
}

export abstract class DynamicFormPageComponent extends BaseDynamicFormComponent {

  @HostBinding('class.content-container') class = true;
  /**
   * @description Component object instance initializer
   * @param builder [[FormBuilder]] Angular ReactiveForm FormBuilder
   * @param appUIStoreManager [[AppUIStoreManager]]
   */
  constructor(
    protected builder: FormBuilder,
    public appUIStoreManager: AppUIStoreManager
  ) {
    super(builder, appUIStoreManager);
  }
}
