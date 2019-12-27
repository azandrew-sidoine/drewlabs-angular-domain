import { AppUIStoreManager } from './app-ui-store-manager.service';
import { Subscription } from 'rxjs';
import { UIState } from 'src/app/lib/domain/components/ui-store/ui-state';
import { HostBinding } from '@angular/core';
import { AlertConfig } from '../components/app-alert/app-alert.component';

export interface IFormViewComponent {
  /**
   * @description After form submission request submit successfully
   */
  onFormRequestSubmittedSuccessfully(): void;
}

/**
 * @description A component that is wrapped arround a child component containing an HTML form
 */
export interface IFormParentComponent {

  /**
   * @description Handler for child component form submit event
   * @param event [[any]]
   */
  onChildComponentFormSubmitted(event: any): void;
}

/**
 * @description Helper class for applying [[@HostBinding('class.content-container')]] property
 * to the subclass in order to transform it into a clarity main-container view
 */
export class PageCompoment {
  @HostBinding('class.content-container') class = true;
}

export abstract class AbstractAlertableComponent {

  public performingAction = false;
  public actionUiMessage: string;
  public uiStoreSubscriptions: Subscription[] = [];
  public componentIsInitialized = false;

  constructor(public appUIStoreManager: AppUIStoreManager) {}
  /**
   * @description AlertProperties get that load the alert properties from app ui store provider
   */
  get alertProperties(): AlertConfig {
    return this.appUIStoreManager.alertConfigs;
  }
  /**
   * @description Subscribe to UI events on the inherited component
   */
  subscribeToUIActions() {
    this.uiStoreSubscriptions.push(
      this.appUIStoreManager.appUIStore.uiState.subscribe(
        (uiState: UIState) => {
          this.performingAction = uiState.performingAction;
          this.actionUiMessage = uiState.uiMessage;
        }
      )
    );
  }

  showBadRequestMessage(message: string) {
    this.appUIStoreManager.completeActionWithWarning(
      message
    );
  }

  showErrorMessage(message: string) {
    this.appUIStoreManager.completeActionWithError(
      message
    );
  }

  showSuccessMessage(message: string) {
    this.appUIStoreManager.completeActionWithSuccess(
      message
    );
  }

  /**
   * @description Unsubscribe from any ui event subscriptions
   */
  clearUIActionSubscriptions() {
    if (this.uiStoreSubscriptions.length > 0) {
      this.uiStoreSubscriptions.map(subscription => subscription.unsubscribe());
    }
  }

  /**
   * @description Calls the application UI Store reset method the reinit the ui store
   */
  resetUIStore() {
    this.appUIStoreManager.resetUIStore();
  }
}

/**
 * Helper class that apply [[@HostBinding('class.content-container')]] to it subclass and provide methods and properties
 * to component for responding to ui events and actions
 */
export class AlertablePageCompoment extends AbstractAlertableComponent {
  @HostBinding('class.content-container') class = true;

  constructor(uiManager: AppUIStoreManager) {
    super(uiManager);
  }
}