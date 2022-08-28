import { Injectable, OnDestroy } from '@angular/core';
import { interval } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { emptyObservable, observableFrom } from '../../rxjs/helpers';
import { Video } from '../../webcam/helpers';
import { drawRect } from '../helpers';
import { loadModel, predict } from '../helpers/blazeface';
import {
  BlazeModelConfig,
  TypeBlazeDetector,
  TypeBlazePrediction,
} from '../types';

@Injectable()
export class BlazeFaceDetectorService implements OnDestroy {
  _model!: TypeBlazeDetector | undefined;

  public loadModel = (type?: BlazeModelConfig) => {
    const result$ = observableFrom(loadModel(type)).pipe(
      tap((model) => (this._model = model))
    );
    return result$;
  };

  getModel() {
    return this._model;
  }

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
      'Model must be loaded before calling the detector function... Call loadModel() before calling this detectFaces()'
    );
  };

  ngOnDestroy(): void {
    this.deleteModel();
  }
}

@Injectable()
export class BlazeFacePointsDrawerService {
  public drawFacePoints =
    (context?: CanvasRenderingContext2D) =>
    (facePoints?: TypeBlazePrediction[], color?: string) => {
      if (facePoints && context) {
        requestAnimationFrame(() => {
          const points = facePoints.map((point) => {
            const [x, y] = point.topLeft as [number, number];
            const [dx, dy] = point.bottomRight as [number, number];
            const [width, height] = [dx - x, dy - y];
            return { x, y, width, height };
          });
          drawRect(points)(context || undefined, color);
        });
      }
    };
}
