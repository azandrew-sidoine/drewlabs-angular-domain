import { Injectable } from "@angular/core";
import { FaceLandmarksDetector, FaceLandmarksPrediction, SupportedPackages } from "@tensorflow-models/face-landmarks-detection";
import { interval } from "rxjs";
import { mergeMap, tap } from "rxjs/operators";
import { emptyObservable, observableFrom } from "../../../rxjs/helpers";
import { Video } from "../../ng/webcam/helpers";
import { drawMesh } from "../helpers";
import { FaceLandmarksModelConfig, loadModel, predict } from "../helpers/facemesh";

@Injectable({
  providedIn: 'root'
})
export class FaceMeshDetectorService {

  get model() {
    return this._model;
  }

  _model!: FaceLandmarksDetector | undefined;

  public loadModel = (type?: SupportedPackages, config: FaceLandmarksModelConfig = { shouldLoadIrisModel: true }) => {
    const result$ = observableFrom(loadModel(type, config))
      .pipe(
        tap(model => this._model = model)
      );
    return result$;
  }

  public deleteModel = () => this._model = undefined;

  public detectFaces = (
    input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
    _interval: number
  ) => {
    if (this._model) {
      return interval(_interval)
        .pipe(
          mergeMap(_ => {
            if (this._model) {
              return observableFrom(predict(this._model, input instanceof HTMLVideoElement ? Video.read(input) : input));
            }
            return emptyObservable();
          })
        );
    }
    throw new Error('Model must be loaded before calling the detector function... Call loadModel() before calling this detectFaces()');
  }

}

@Injectable({
  providedIn: 'root'
})
export class FaceMeshPointsDrawerService {

  public drawFacePoints = (context?: CanvasRenderingContext2D) => (facePoints?: FaceLandmarksPrediction[]) => {
    if (facePoints && context) {
      drawMesh(facePoints, context || undefined);
    }
  }
}
