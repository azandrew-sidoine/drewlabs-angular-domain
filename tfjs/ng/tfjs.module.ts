import { ModuleWithProviders, NgModule } from '@angular/core';
import { BLAZE_FACE, FACE_MESH } from '../types';
import {
  BlazeFaceDetectorService,
  BlazeFacePointsDrawerService,
} from './blazeface.service';
import {
  FaceMeshDetectorService,
  FaceMeshPointsDrawerService,
} from './facemesh.service';

@NgModule({
  imports: [],
  providers: [BlazeFacePointsDrawerService, FaceMeshPointsDrawerService],
})
export class TFJSModule {
  static forRoot(): ModuleWithProviders<TFJSModule> {
    return {
      ngModule: TFJSModule,
      providers: [
        FaceMeshDetectorService,
        BlazeFaceDetectorService,
        {
          provide: BLAZE_FACE,
          useClass: BlazeFaceDetectorService,
        },
        {
          provide: FACE_MESH,
          useClass: FaceMeshDetectorService,
        },
      ],
    };
  }
}
