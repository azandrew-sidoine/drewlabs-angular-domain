import { NgModule, ModuleWithProviders } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";
import { HttpRequestService } from "../core/http-request.service";
import { DrewlabsRessourceServerClient } from "../core/ressource-server-client";
import { parseV2HttpResponse } from "../core/v2/http-response";
import { TransformResponseHandlerFn } from "../contracts";

// tslint:disable-next-line: interface-over-type-literal
type ModuleConfigParams = {
  serverURL: string;
  requestResponseHandler?: TransformResponseHandlerFn;
};

@NgModule({
  imports: [HttpClientModule],
  exports: [HttpClientModule],
  providers: [],
})
export class DrewlabsHttpModule {
  static forRoot(
    configs: ModuleConfigParams
  ): ModuleWithProviders<DrewlabsHttpModule> {
    return {
      ngModule: DrewlabsHttpModule,
      providers: [
        HttpRequestService,
        {
          provide: "SERVER_URL",
          useValue: configs.serverURL,
        },
        {
          provide: "ResponseTransformHandlerFn",
          useValue: configs.requestResponseHandler || parseV2HttpResponse,
        },
        DrewlabsRessourceServerClient,
      ],
    };
  }
}
