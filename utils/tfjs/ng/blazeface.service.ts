import { Injectable } from "@angular/core";
import { BlazeFaceModel, NormalizedFace } from "@tensorflow-models/blazeface";
import { interval } from "rxjs";
import { mergeMap, tap } from "rxjs/operators";
import { emptyObservable, observableFrom } from "../../../rxjs/helpers";
import { Video } from "../../ng/webcam/helpers";
import { BlazeModelConfig, loadModel, predict } from "../helpers/blazeface";

/**
 * @internal
 * 
 * Higher order function to draw rectangle stroke
 */
function drawRectStroke(
  facePoints: { x: number; y: number; width: number; height: number }[]
) {
  return (context?: CanvasRenderingContext2D) => {
    if (context) {
      facePoints.forEach(({ x, y, width, height }) => {
        if (x && y && width && height) {
          context.strokeStyle = "green";
          context.strokeRect(x, y, width, height);
        }
      });
    }
  };
}

@Injectable({
  providedIn: "root",
})
export class BlazeFaceDetectorService {
  get model() {
    return this._model;
  }

  _model!: BlazeFaceModel | undefined;

  public loadModel = (type?: BlazeModelConfig) => {
    const result$ = observableFrom(loadModel(type)).pipe(
      tap((model) => (this._model = model))
    );
    return result$;
  };

  public deleteModel = () => (this._model = undefined);

  public detectFaces = (
    input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
    _interval: number
  ) => {
    if (this._model) {
      return interval(_interval).pipe(
        mergeMap((_) => {
          if (this._model) {
            return observableFrom(
              predict(
                this._model,
                input instanceof HTMLVideoElement ? Video.read(input) : input
              )
            );
          }
          return emptyObservable();
        })
      );
    }
    throw new Error(
      "Model must be loaded before calling the detector function... Call loadModel() before calling this detectFaces()"
    );
  };
}

@Injectable({
  providedIn: "root",
})
export class BlazeFacePointsDrawerService {
  public drawFacePoints =
    (context?: CanvasRenderingContext2D) => (facePoints?: NormalizedFace[]) => {
      if (facePoints && context) {
        requestAnimationFrame(() => {
          const points = facePoints.map((point) => {
            const [x, y] = point.topLeft as [number, number];
            const [dx, dy] = point.bottomRight as [number, number];
            const [width, height] = [dx - x, dy - y];
            return { x, y, width, height };
          });
          drawRectStroke(points)(context || undefined);
        });
      }
    };
}
