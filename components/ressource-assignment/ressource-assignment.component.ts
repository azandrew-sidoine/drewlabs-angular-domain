import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AbstractAlertableComponent } from 'src/app/lib/domain/helpers/component-interfaces';
import { AppUIStoreManager } from 'src/app/lib/domain/helpers/app-ui-store-manager.service';
import { Dialog } from 'src/app/lib/domain/utils/window-ref';
import { ApplicationUsersService } from 'src/app/lib/domain/auth/core/services/users.service';
import { User } from 'src/app/lib/domain/auth/models/user';
import { isDefined } from 'src/app/lib/domain/utils/type-utils';
import { IResponseBody } from 'src/app/lib/domain/http/contracts/http-response-data';
import { DrewlabsRessourceAssignmentService } from './ressource-assignment.service';
import { DrewlabsRessourceAssignment } from './ressource-assignment';
import { isArray } from '../../utils/type-utils';

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'drewlabs-ressource-assignment',
  templateUrl: './ressource-assignment.component.html',
  styles: [
    `
    .dropdown .dropdown-toggle.btn {
      margin-right: .5rem;
    }
    .clr-dropdown-menu {
      max-height: 200px;
      width: 100%;
    }

    .users-viewport {
      min-height: 75px;
      width: auto;
      overflow-x: hidden;
    }
    `
  ]
})
export class DrewlabsRessourceAssignmentComponent extends AbstractAlertableComponent implements OnInit {

  @Input() collectionID: number | string;
  public users: User[];
  @Input() public permission: string[] | string;
  @Input() public buttonDisabled = false;
  @Input() selectedIds: number[] = [];
  // tslint:disable-next-line: no-inferrable-types
  @Input() triggerButtonClass: string = 'btn btn-primary';
  @Output() assignmentCompletedSuccessfully = new EventEmitter<object>();


  constructor(
    uiStore: AppUIStoreManager,
    private service: ApplicationUsersService,
    private dialog: Dialog,
    public componentService: DrewlabsRessourceAssignmentService,
  ) { super(uiStore); }

  async ngOnInit() {
    let permissionquery = null;
    if (isDefined(this.permission) && isArray(this.permission.length)) {
      permissionquery = `${'?permission=' + (this.permission as string[]).join(',')}`.trim();
    } else if (isDefined(this.permission) && !isArray(this.permission.length)) {
      permissionquery = `${'?permission=' + this.permission}`.trim();
    }
    try {
      this.users = await this.service.getUsers(`${this.service.ressourcesPath}${isDefined(permissionquery) ? permissionquery : ''}`);
    } catch (_) {
      console.log(_);
    }
  }

  async onUserSelected(user: User) {
    this.onBatchAssignment(user, this.selectedIds);
  }

  async onBatchAssignment(user: User, selectedItems: number[]) {
    const translations = await this.componentService.loadTranslations(null, user.username, selectedItems.length);
    if (this.dialog.confirm(translations.batchAssignmentPrompt)) {
      this.appUIStoreManager.initializeUIStoreAction();
      this.componentService.createAssignment(
        `${this.componentService.assignationRessoucesPath}/${this.collectionID}`, selectedItems.map((i) => {
          return {
            ressource_id: i,
            assigned_to: user.id
          };
        }))
        .then((res) => {
          this.onAssignmentResponse(res, translations);
        })
        .catch((_) => {
          this.showErrorMessage(translations.serverRequestFailed);
        });
    }
  }

  onAssignmentResponse(res: DrewlabsRessourceAssignment | IResponseBody, trans: any) {
    if ((res instanceof DrewlabsRessourceAssignment) || (res.statusOK)) {
      // Notify the parent of successful completion of the assignment request
      this.assignmentCompletedSuccessfully.emit({});
      this.showSuccessMessage(trans.successfullAssignment);
      this.buttonDisabled = true;
    } else if (res.errors) {
      this.showBadRequestMessage(trans.invalidRequestParams);
    } else {
      this.showBadRequestMessage(trans.serverRequestFailed);
    }
  }
}