import { Injectable, OnDestroy, Injector } from "@angular/core";
import { FormService } from "../components/dynamic-inputs/core/form-control/form.service";
import { TranslationService } from "../translator";
import {
  DynamicFormHelpers,
  ComponentReactiveFormHelpers,
} from "./component-reactive-form-helpers";
import { ICollection } from "../contracts/collection-interface";
import { filter, startWith, takeUntil } from "rxjs/operators";
import { AbstractEntityProvider } from "../entity/abstract-entity";
import { AbstractAlertableComponent } from "src/app/lib/domain/helpers/component-interfaces";
import { FormGroup } from "@angular/forms";
import { IEntity } from "../entity/contracts/entity";
import { TypeUtilHelper } from "./type-utils-helper";
import {
  AppUIStoreManager,
  ActionResponseParams,
} from "./app-ui-store-manager.service";
import { ISerializableBuilder } from "../built-value/contracts/serializers";
import { IDynamicForm } from "../components/dynamic-inputs/core/contracts/dynamic-form";
import { IResponseBody } from "../http/contracts/http-response-data";
import { TranslationParms } from "../translator/translator.service";
import * as lodash from "lodash";
import { HandlersResultMsg } from "../entity/contracts/entity-handler-types";
import { ArrayUtils, isDefined } from "../utils";
import { Collection } from "../collections/collection";
import { createSubject } from "../rxjs/helpers";
import { Observable } from "rxjs";
import { isArray } from "lodash";

/**
 * @description Definition of form request configuration object
 */
export interface IFormRequestConfig {
  id: number;
  label?: string;
}

@Injectable({
  providedIn: "root",
})
export class FormHelperService implements OnDestroy {
  private inMemoryFormCollection: ICollection<IDynamicForm> = new Collection();
  /**
   * @description Load dynamic form subject instance
   * @var [[BehaviorSubject]]
   */
  public loadForms =
    createSubject<{
      configs: IFormRequestConfig[];
      result: HandlersResultMsg;
    }>();

  /**
   * @description Form successfully loaded subject instance
   */
  // tslint:disable-next-line: variable-name
  protected _formLoaded = createSubject<ICollection<IDynamicForm>>();
  get formLoaded$(): Observable<ICollection<IDynamicForm>> {
    return this._formLoaded.pipe(
      startWith(this.inMemoryFormCollection),
      takeUntil(this.destroy$)
    );
  }
  public readonly destroy$ = createSubject();

  /**
   * @description Instance constructor
   */
  constructor(
    public readonly form: FormService,
    private translate: TranslationService
  ) {}

  getFormById = (id: number | string) => {
    return new Promise<IDynamicForm>((resolve, _) => {
      this.form
        .getForm(id)
        .then(async (f) => {
          if (isDefined(f)) {
            resolve(
              await DynamicFormHelpers.buildDynamicForm(f, this.translate)
            );
          }
          resolve(null);
        })
        .catch((err) => {
          _(err);
        });
    });
  };

  getForms = async (params: { [prop: string]: any }) => {
    const values = await this.form.getForms(params);
    return values && isArray(values)
      ? Promise.all(
          values.map((value) =>
            DynamicFormHelpers.buildDynamicForm(value, this.translate)
          )
        )
      : Promise.all([]);
  };

  subscribe = () => {
    // Initialize publishers
    // Register to publishers events
    this.loadForms
      .asObservable()
      .pipe(
        takeUntil(this.destroy$),
        filter((source) => isDefined(source))
      )
      .subscribe(async (source) => {
        try {
          const collection: ICollection<IDynamicForm> = new Collection();
          // Get list of form ids that are not in the in-memory forms collection
          const configs = source.configs.filter((item) => {
            return !isDefined(
              this.inMemoryFormCollection.get(item.id.toString())
            );
          });
          // Get list of form ids that are in the in-memory forms collection
          const inmemoryConfigs = source.configs.filter((item) => {
            return isDefined(
              this.inMemoryFormCollection.get(item.id.toString())
            );
          });
          // Get form configurations that are not in the in-memory forms' collection from the backend provider
          const values = (
            (await this.getForms({
              _query: JSON.stringify({
                whereIn: {
                  column: "id",
                  match: configs.map((config) => config.id),
                },
              }),
              with_controls: true,
            })) as IDynamicForm[]
          ).reduce((acc, current) => {
            const obj = {} as { [prop: string]: any };
            obj[current.id.toString()] = current;
            return { ...acc, ...obj };
          }, {}) as { [prop: string]: IDynamicForm };
          configs.forEach((item) => {
            collection.add(item.label, { ...values[item.id.toString()] });
            // Add loaded form configurations to the in-memory collection
            this.inMemoryFormCollection.add(item.id.toString(), {
              ...values[item.id.toString()],
            });
          });
          inmemoryConfigs.forEach((item) => {
            // Get the dynamic form configuration from the in-memory forms' collection
            collection.add(
              item.label,
              Object.assign(
                {},
                this.inMemoryFormCollection.get(item.id.toString())
              )
            );
          });
          this._formLoaded.next(lodash.cloneDeep(collection));
          if (isDefined(source.result.success)) {
            source.result.success();
          }
        } catch (error) {
          if (isDefined(source.result.error)) {
            throw source.result.error(error);
          }
        }
      });
  };

  /**
   * @description Unsubscribe from publishers events
   */
  unsubscribe = () => {
    this.destroy$.next({});
    return this;
  };

  /**
   * @description Handles sujects completers
   * @param actions [[Subjeect]]
   */
  onCompleActionListeners = (actions: any[] = null) => {
    this.destroy$.next({});
  };

  public ngOnDestroy(): void {
    this.unsubscribe();
  }
}

/**
 * @classdesc Implementation provider for form component views. The current class provides with basic functionnalities of
 * functionnalities a simple form view component will handle through the use of dynamic form implementions,
 */
export abstract class FormsViewComponent<
  T extends IEntity
> extends AbstractAlertableComponent {
  submissionEndpointURL: string;
  componentFormGroup: FormGroup;
  public selected: T;
  public readonly typeHelper: TypeUtilHelper;
  private formHelper: FormHelperService;

  constructor(
    injector: Injector,
    private entityProvider: AbstractEntityProvider<T>,
    private builder: ISerializableBuilder<T>
  ) {
    super(injector.get(AppUIStoreManager));
    this.typeHelper = injector.get(TypeUtilHelper);
    this.formHelper = injector.get(FormHelperService);
  }

  async initState(): Promise<any> {
    this.subscribeToUIActions();
    this.appUIStoreManager.initializeUIStoreAction();
    // Call service subscription method to subscribe to event
    this.formHelper.subscribe();
    // Triggers form loading event
    this.formHelper.loadForms.next({
      configs: this.getFormConfigs(),
      result: {
        error: (error: any) => {},
        success: () => {
          this.appUIStoreManager.completeUIStoreAction();
        },
        warnings: (errors: any) => {},
      },
    });
    // Register to form loading event response
    this.formHelper.formLoaded$
      .pipe(
        takeUntil(this.formHelper.destroy$),
        filter((form) => {
          return (
            this.typeHelper.isDefined(form) &&
            ArrayUtils.containsAll(
              form.keys(),
              this.getFormConfigs().map((i) => i.label)
            )
          );
        })
      )
      .subscribe(
        (forms) => {
          if (forms) {
            this.onFormCollectionLoaded(forms);
            this.suscribeToFormControlChanges();
          }
        },
        (err) => {
          console.log(err);
        }
      );
  }

  async onFormSubmit(): Promise<void> {
    ComponentReactiveFormHelpers.validateFormGroupFields(
      this.componentFormGroup
    );
    if (this.componentFormGroup.valid) {
      const obj = this.onFormGroupRawValue(
        this.componentFormGroup.getRawValue()
      );
      this.appUIStoreManager.initializeUIStoreAction();
      if (!this.typeHelper.isDefined(this.selected)) {
        this.entityProvider.createRequest.next({
          builder: this.builder,
          req: { path: this.submissionEndpointURL, body: obj },
        });
      } else {
        if (this.typeHelper.isDefined(this.selected)) {
          this.entityProvider.updateRequest.next({
            // tslint:disable-next-line: max-line-length
            builder: this.builder,
            req: {
              path: this.submissionEndpointURL,
              body: obj,
              id: this.selected.id,
            },
          });
        } else {
          this.appUIStoreManager.completeActionWithWarning(
            `Please set the selected attribute on the current component`
          );
        }
      }
    }
  }

  dispose(): void {
    this.entityProvider.unsubscribe();
    this.formHelper.unsubscribe();
    this.clearUIActionSubscriptions();
    this.resetUIStore();
  }

  /**
   * @description Returns the configuration of form groups to be loaded from the server
   */
  protected abstract getFormConfigs(): IFormRequestConfig[];

  /**
   * @description provides implementation for building loaded form into formgroup | abstract control
   */
  protected abstract onFormCollectionLoaded(
    forms: ICollection<IDynamicForm>
  ): void;

  /**
   * @description This method should be use to provide form group values parsing when the form gets submitted by the user
   * Any parsing implementation should be defined in the current method for them to be applied to the form control value
   * during form submission
   * @overridable
   * @param value [[object|any]]
   */
  // tslint:disable-next-line: typedef
  protected onFormGroupRawValue(value: object | any) {
    return value;
  }

  /**
   * @description Should be override to provide handler for form control value changes
   * @overridable
   */
  protected suscribeToFormControlChanges(): void {
    // Provide method implementation in subclasse if needed
  }
}

/**
 * @description Provides basic implementation for form view component containers, handling create,
 * update, and delete operation at the lower level
 */
export abstract class FormViewContainerComponent<
  T
> extends AbstractAlertableComponent {
  public typeHelper: TypeUtilHelper;
  // tslint:disable-next-line: variable-name
  private _translate: TranslationService;

  constructor(
    injector: Injector,
    // tslint:disable-next-line: variable-name
    private _entityProvider: AbstractEntityProvider<T>,
    // tslint:disable-next-line: variable-name
    private _tranlationConfigs: TranslationParms
  ) {
    super(injector.get(AppUIStoreManager));
    this.typeHelper = injector.get(TypeUtilHelper);
    this._translate = injector.get(TranslationService);
  }

  async initState(): Promise<void> {
    this._entityProvider.subscribe();
    const translations = await this._translate.loadTranslations(
      this._tranlationConfigs.keys,
      this._tranlationConfigs.translateParams
    );
    this._entityProvider.deleteResult$
      .pipe(
        takeUntil(this._entityProvider.destroy$),
        filter((source) => this.typeHelper.isDefined(source))
      )
      .subscribe(
        (res) => {
          this.onDeleteActionResult(res);
        },
        (_) =>
          this.appUIStoreManager.completeActionWithError(
            `${translations.serverRequestFailed}`
          )
      );

    this._entityProvider.createResult$
      .pipe(
        takeUntil(this._entityProvider.destroy$),
        filter((form) => this.typeHelper.isDefined(form))
      )
      .subscribe(
        (res) => {
          this.onCreateActionResult(res);
        },
        (_) =>
          this.appUIStoreManager.completeActionWithError(
            `${translations.serverRequestFailed}`
          )
      );
    this._entityProvider.updateResult$
      .pipe(
        takeUntil(this._entityProvider.destroy$),
        filter((source) => this.typeHelper.isDefined(source))
      )
      .subscribe(
        (res) => {
          this.onUpdateActionResult(res);
        },
        (_) =>
          this.appUIStoreManager.completeActionWithError(
            `${translations.serverRequestFailed}`
          )
      );
  }

  /**
   * @description [[_entityProvider]] property getter
   */
  // tslint:disable-next-line: typedef
  get entityProvider() {
    return this._entityProvider;
  }

  /**
   * @description [[_translate]] property getter
   */
  // tslint:disable-next-line: typedef
  get translate() {
    return this._translate;
  }

  /**
   * @description [[_tranlationConfigs]] property getter
   */
  // tslint:disable-next-line: typedef
  get tranlationConfigs() {
    return this._tranlationConfigs;
  }

  /**
   * @description Provides action to be executed when a delete action get completed successfully.
   * By default it only show result message to UI
   * @evrridable
   * @param result [[IResponseBody]]
   */
  // tslint:disable-next-line: deprecation
  async onDeleteActionResult(result: IResponseBody): Promise<void> {
    const translations = await this._translate.loadTranslations(
      this._tranlationConfigs.keys,
      this._tranlationConfigs.translateParams
    );
    this.appUIStoreManager.onActionResponse({
      res: result,
      okMsg: translations.successfulRequest,
      badReqMsg: `${translations.invalidRequestParams}`,
    } as ActionResponseParams);
  }

  /**
   * @description Provides implentations of update result handler that gets call when update request get completed
   * @param result [[IResponseBody]]
   */
  // tslint:disable-next-line: deprecation
  abstract onUpdateActionResult(result: IResponseBody): Promise<void>;

  /**
   * @description Provides implentations of create result handler that gets call when create request get completed
   * @param result [[IResponseBody]]
   */
  // tslint:disable-next-line: deprecation
  abstract onCreateActionResult(
    result: IResponseBody | T | boolean
  ): Promise<void>;

  dispose(): void {
    this._entityProvider.unsubscribe();
    this.clearUIActionSubscriptions();
    this.resetUIStore();
  }
}
