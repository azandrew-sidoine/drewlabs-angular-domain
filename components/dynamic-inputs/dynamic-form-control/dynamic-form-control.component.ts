import { ArrayUtils } from 'src/app/lib/domain/utils/array-utils';
import {
  IHTMLFormControl,
  SelectInput,
  PasswordInput,
  CheckBoxInput,
  DateInput,
  TextInput,
  RadioInput,
  TextAreaInput,
  NumberInput,
  PhoneInput,
  InputTypes,
  RadioItem,
  CheckboxItem,
  ISelectItem,
  FileInput,
  HMTLInput
} from 'src/app/lib/domain/components/dynamic-inputs/core';
import { FormGroup, FormBuilder, NgModel, FormControl } from '@angular/forms';
import { AbstractControl, FormArray } from '@angular/forms';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { MomentUtils } from 'src/app/lib/domain/utils/moment-utils';
import { Observable } from 'rxjs';
import { DropzoneConfigInterface } from 'ngx-dropzone-wrapper';
import { environment } from '../../../../../../environments/environment';
import { isDefined } from '../../../utils/type-utils';
import { DropzoneComponent } from '../../dropzone/dropzone.component';
import { readFileAsDataURI } from '../../../utils/browser';

export interface FileFormControl {
  uuid: string;
  dataURL: string;
  extension: string;
}
@Component({
  selector: 'app-dynamic-inputs',
  templateUrl: './dynamic-form-control.component.html',
  styleUrls: ['./dynamic-form-control.component.css']
})
export class DynamicFormControlComponent implements OnInit, OnDestroy {
  // Formcontrol injected from the parent controller
  @Input() control: AbstractControl;
  @Input() listenForChanges: boolean;
  // private controlSubscription: Subscription;
  // Event emitter emitted when the value of the input changes
  @Output() valueChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() multiSelectItemRemove = new EventEmitter<any>();
  // Configuration parameters of the input
  @Input() inputConfig: IHTMLFormControl;
  @Input() listItems:
    | Observable<Array<ISelectItem | CheckboxItem | RadioItem>>
    | Array<ISelectItem | CheckboxItem | RadioItem>;
  // Enumeration of input types
  public inputTypes = InputTypes;
  // String representation of today
  public today: string;
  public formArrayGroup: FormGroup;
  public showPassword = true;

  // Property for handling File Input types
  public dropzoneConfigs: DropzoneConfigInterface;
  public dropzoneConfig: DropzoneConfigInterface;
  @ViewChild('dropzoneContainer', { static: false })
  dropzoneContainer: DropzoneComponent;

  constructor(private builder: FormBuilder) { }

  ngOnInit() {
    this.today = MomentUtils.parseDate(
      new Date(),
      (this.inputConfig as DateInput).dateInputFormat
        ? (this.inputConfig as DateInput).dateInputFormat
        : 'dd/mm/yyyy'
    );
    if (this.inputConfig.type === InputTypes.FILE_INPUT) {
      this.dropzoneConfigs = {
        maxFiles: this.asFileInput(this.inputConfig).multiple ? 50 : 1,
        maxFilesize: this.asFileInput(this.inputConfig).maxFileSize ? this.asFileInput(this.inputConfig).maxFileSize : 4,
        url: isDefined(this.asFileInput(this.inputConfig).uploadUrl) && this.asFileInput(this.inputConfig).uploadUrl !== '' ?
          this.asFileInput(this.inputConfig).uploadUrl : environment.apiFileUploadURL,
        uploadMultiple: this.asFileInput(this.inputConfig).multiple ? this.asFileInput(this.inputConfig).multiple : false
      };
    }
    if (
      this.inputConfig &&
      this.inputConfig.type === InputTypes.CHECKBOX_INPUT &&
      (this.inputConfig as CheckBoxInput).items.length > 0
    ) {
      this.formArrayGroup = this.builder.group({
        formGroupItems: this.control
      });
    }
    if (this.listenForChanges) {
      this.control.valueChanges.subscribe((value) => {
        this.valueChange.emit(value);
      });
    }
  }

  /**
   * @description Return an abstract control as a [[FormArray]]
   * @param control [[AbstractControl]]
   */
  public asFormArray(control: AbstractControl): FormArray {
    return control as FormArray;
  }

  /**
   * @description Returns a dynamic input configuration as a [[SelectInput]]
   * @param input [[IHTMLFormControl]] Dynamic input configurations instance
   */
  public asSelectInput(input: IHTMLFormControl): SelectInput {
    return input as SelectInput;
  }
  /**
   * @description Returns a dynamic input configuration as a [[DateInput]]
   * @param input [[IHTMLFormControl]] Dynamic input configurations instance
   */
  public asDateInput(input: IHTMLFormControl): DateInput {
    return input as DateInput;
  }
  /**
   * @description Returns a dynamic input configuration as a [[CheckBoxInput]]
   * @param input [[IHTMLFormControl]] Dynamic input configurations instance
   */
  public asCheckBoxInput(input: IHTMLFormControl): CheckBoxInput {
    return input as CheckBoxInput;
  }

  /**
   * @description Returns a dynamic input configuration as a [[RadioInput]]
   * @param input [[IHTMLFormControl]] Dynamic input configurations instance
   */
  public asRadioInput(input: IHTMLFormControl): RadioInput {
    return input as RadioInput;
  }
  /**
   * @description Returns a dynamic input configuration as a [[PasswordInput]]
   * @param input [[IHTMLFormControl]] Dynamic input configurations instance
   */
  public asPasswordInput(input: IHTMLFormControl): PasswordInput {
    return input as PasswordInput;
  }
  /**
   * @description Returns a dynamic input configuration as a [[TextInput]]
   * @param input [[IHTMLFormControl]] Dynamic input configurations instance
   */
  public asTextInput(input: IHTMLFormControl): TextInput {
    return input as TextInput;
  }
  /**
   * @description Returns a dynamic input configuration as a [[TextAreaInput]]
   * @param input [[IHTMLFormControl]] Dynamic input configurations instance
   */
  public asTextAreaInput(input: IHTMLFormControl): TextAreaInput {
    return input as TextAreaInput;
  }
  /**
   * @description Returns a dynamic input configuration as a [[NumberInput]]
   * @param input [[IHTMLFormControl]] Dynamic input configurations instance
   */
  public asNumberInput(input: IHTMLFormControl): NumberInput {
    return input as NumberInput;
  }
  /**
   * @description Returns a dynamic input configuration as a [[TextInput]]
   * @param input [[IHTMLFormControl]] Dynamic input configurations instance
   */
  public asEmailInput(input: IHTMLFormControl): TextInput {
    return input as TextInput;
  }
  /**
   * @description Returns a dynamic input configuration as a [[FileInput]]
   * @param input [[IHTMLFormControl]] Dynamic input configurations instance
   */
  public asFileInput(input: IHTMLFormControl): FileInput {
    return input as FileInput;
  }
  /**
   * @description Returns a dynamic input configuration as a [[HTMLInput]]
   * @param input [[IHTMLFormControl]] Dynamic input configurations instance
   */
  public asHtmlInput(input: IHTMLFormControl): HMTLInput {
    return input as HMTLInput;
  }
  /**
   * @description Returns a dynamic input configuration as a [[PhoneInput]]
   * @param input [[IHTMLFormControl]] Dynamic input configurations instance
   */
  public asPhoneInput(input: IHTMLFormControl): PhoneInput {
    return input as PhoneInput;
  }

  public togglePassWordInput() {
    this.showPassword = !this.showPassword;
  }

  isArray(listItems: Observable<any[]> | any[]) {
    return ArrayUtils.isArray(listItems);
  }

  asObservable(listItems: any): Promise<any> {
    return listItems as Promise<any>;
  }

  radioButtonValueChange(event: any) {
    console.log(event);
    this.control.setValue(event);
  }

  maxNumberSize() {
    return Math.pow(2, 31) - 1;
  }

  // Files Handlers event method
  async onDropzoneFileAdded(event: any | any[]) {
    setTimeout(async () => {
      const files = this.dropzoneContainer.dropzone().getAcceptedFiles();
      if ((this.inputConfig as FileInput).multiple) {
        this.control.setValue((files as any[]).map(async (v) => {
          return {
            uuid: v.upload.uuid,
            dataURL: await readFileAsDataURI(v.dataURL),
            extension: (v.name as string).split('.')[(v.name as string).split('.').length - 1]
          } as FileFormControl;
        }));
      } else {
        this.control.setValue(
          {
            uuid: files[0].upload.uuid,
            dataURL: await readFileAsDataURI(files[0]),
            extension: (files[0].name as string).split('.')[(files[0].name as string).split('.').length - 1]
          } as FileFormControl
        );
      }
    }, 100);
  }

  onDropzoneFileRemoved(event: any) {
    if ((this.inputConfig as FileInput).multiple) {
      this.control.setValue((this.control.value as FileFormControl[]).filter((v) => {
        return v.uuid !== event.upload.uuid;
      }));
    } else {
      this.control.setValue(null);
    }
  }

  onDzThumbnail() { }

  ngOnDestroy() { }
}
