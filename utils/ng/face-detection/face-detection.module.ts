import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FaceDetectionComponent } from './face-detection.component';

@NgModule({
  imports: [CommonModule],
  exports: [FaceDetectionComponent],
  declarations: [FaceDetectionComponent],
})
export class FaceDetectionModule {
  static forRoot(): ModuleWithProviders<FaceDetectionModule> {
    return {
      ngModule: FaceDetectionModule,
      providers: [],
    };
  }
}
