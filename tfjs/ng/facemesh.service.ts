import { Injectable, OnDestroy } from '@angular/core';
import { EMPTY, from, interval } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { Video } from '../../webcam/helpers';
import { drawMesh } from '../helpers';
import { loadModel, predict } from '../helpers/facemesh';
import {
  FaceLandmarksModelConfig,
  FaceMeshDetector,
  TypeFaceMeshDetector,
  TypeFaceMeshPrediction,
  TypeSupportedPackages,
} from '../types';

@Injectable()
export class FaceMeshDetectorService implements FaceMeshDetector, OnDestroy {
  //#region class properties
  model!: TypeFaceMeshDetector | undefined;
  //#endregion class properties

  getModel() {
    return this.model;
  }

  //
  public loadModel(
    type?: TypeSupportedPackages,
    config: FaceLandmarksModelConfig = { shouldLoadIrisModel: true }
  ) {
    return from(loadModel(type, config)).pipe(
      tap((model) => (this.model = model))
    );
  }

  //
  public deleteModel() {
    this.model = undefined;
  }

  //
  public detectFaces = (
    input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
    _interval: number
  ) => {
    if (this.model) {
      return interval(_interval).pipe(
        mergeMap((_) => {
          if (this.model && input) {
            return from(
              predict(
                this.model,
                input instanceof HTMLVideoElement ? Video.read(input) : input
              )
            );
          }
          return EMPTY;
        })
      );
    }
    throw new Error(
      'Model must be loaded before calling the detector function... Call loadModel() before calling this detectFaces()'
    );
  };

  ngOnDestroy(): void {
    this.deleteModel();
  }
}

@Injectable({
  providedIn: 'root',
})
export class FaceMeshPointsDrawerService {
  public drawFacePoints =
    (context?: CanvasRenderingContext2D) =>
    (
      facePoints?: TypeFaceMeshPrediction[],
      color?: string,
      drawBox: boolean = false,
      lightPath: boolean = false
    ) => {
      if (facePoints && context) {
        drawMesh(facePoints, context || undefined, color, drawBox, lightPath);
      }
    };
}
