import { Component, Input, ViewChild, ViewContainerRef, ComponentRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormArray, FormGroup, FormControl, AbstractControl } from '@angular/forms';
import { IDynamicForm } from '../../core/contracts/dynamic-form';
import { RepeatableGroupChildComponent } from './repeatable-group-child/repeatable-group-child.component';
import { DynamicComponentService } from '../../../services/dynamic-component-resolver';
import { createSubject } from '../../../../rxjs/helpers/creator-functions';
import { takeUntil } from 'rxjs/operators';
import { createDynamicForm } from '../../core/helpers';

@Component({
  selector: 'app-dynamic-repetable-group',
  templateUrl: './dynamic-repetable-group.component.html',
  styles: [
    `
    .clr-offset-margin-right {
      margin-right: -.5rem !important;
    }
    `
  ]
})
export class DynamicRepetableGroupComponent implements OnDestroy {

  // Injectable inputs
  @Input() control!: FormArray;
  @Input() formBindings: { [prop: string]: IDynamicForm } = {};
  /**
   * @deprecated
   */
  @Input() form!: IDynamicForm;
  @Input() addButtonText = 'Plus';
  @Input() hideAddNewFormgroupButton = false;
  @Input() prefixLabel!: string;
  @Input() offsetAddNewGroupButton = true;

  @Output() childCreate = new EventEmitter<AbstractControl>();
  @Output() childEdit = new EventEmitter<AbstractControl>();
  @Output() updateParentValueAndValidity = new EventEmitter<object>();
  @Output() removedControlGroup = new EventEmitter<object>();
  // tslint:disable-next-line: no-inferrable-types
  @Input() singleColumnView: boolean = false;

  // Output event
  @Output() addNewControlGroup: EventEmitter<object> = new EventEmitter();

  private controlsContainerRefs: Array<ComponentRef<RepeatableGroupChildComponent>> = [];
  @ViewChild('controlsContainer', { read: ViewContainerRef, static: true }) controlsContainer!: ViewContainerRef;
  private totalAddedComponent = 0;
  public initComponent = new EventEmitter<object>();
  public addNewGroupButtonContainerClass = this.offsetAddNewGroupButton ? 'clr-col-3 clr-offset-2 clr-offset-margin-right' : '';

  private _destroy$ = createSubject();

  constructor(
    private dynamicComponentLoader: DynamicComponentService<RepeatableGroupChildComponent>
  ) { }

  // tslint:disable-next-line: typedef
  collapseChildControlComponents() {
    this.controlsContainerRefs.forEach((ref) => {
      ref.instance.isAccordionOpened = false;
    });
  }

  // tslint:disable-next-line: typedef
  addChildComponent(controlIndex: number, formGroupState: AbstractControl, showEditButton = false, form?: IDynamicForm) {
    this.totalAddedComponent += 1;
    const controlComponentRef: ComponentRef<RepeatableGroupChildComponent> = this.dynamicComponentLoader.createComponent(
      this.controlsContainer,
      RepeatableGroupChildComponent
    );
    (formGroupState as FormGroup).addControl('formarray_control_index', new FormControl(controlIndex));
    // Initialize child component input properties
    if (form) {
      controlComponentRef.instance.form = createDynamicForm(form);
    }
    controlComponentRef.instance.formGroup = formGroupState as FormGroup;
    controlComponentRef.instance.index = ({ index: this.totalAddedComponent }).index;
    controlComponentRef.instance.label = `${this.prefixLabel} ${({ index: this.totalAddedComponent }).index}`;
    controlComponentRef.instance.formGroup.addControl('index', new FormControl(controlComponentRef.instance.index));
    controlComponentRef.instance.showEditButton = showEditButton;
    controlComponentRef.instance.singleColumnView = this.singleColumnView;

    // Ends child component properties initialization
    controlComponentRef.instance.create
      .pipe(
        takeUntil(this._destroy$)
      )
      .subscribe((state) => this.childCreate.emit(state));
    controlComponentRef.instance.edit
      .pipe(
        takeUntil(this._destroy$)
      )
      .subscribe((state) => this.childEdit.emit(state));

    controlComponentRef.instance.componentDestroyer
      .pipe(
        takeUntil(this._destroy$)
      )
      .subscribe(
        () => {
          if (this.totalAddedComponent > 1) {
            controlComponentRef.destroy();
            this.totalAddedComponent -= 1;
            // Remove the elment from the list of reference components
            this.controlsContainerRefs = this.controlsContainerRefs.filter(
              (v: ComponentRef<RepeatableGroupChildComponent>) => {
                return v.instance === controlComponentRef.instance ? false : true;
              }
            );
            this.control.removeAt(controlComponentRef.instance.formGroup.getRawValue().formarray_control_index);
            this.removedControlGroup.emit({});
          } else {
            controlComponentRef.instance.formGroup.reset();
            this.control.updateValueAndValidity();
          }
        }
      )
    this.controlsContainerRefs.push(controlComponentRef);
  }

  // tslint:disable-next-line: typedef
  ngOnDestroy() {
    this._destroy$.next(true);
  }
}
