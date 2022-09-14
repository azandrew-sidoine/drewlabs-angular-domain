import { Injectable, OnDestroy } from '@angular/core';
import { EMPTY, from, interval } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
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
  model!: TypeBlazeDetector | undefined;

  public loadModel = (type?: BlazeModelConfig) => {
    const result$ = from(loadModel(type));
    result$.pipe(tap((model) => (this.model = model)));
    return result$;
  };

  getModel() {
    return this.model;
  }

  public deleteModel = () => (this.model = undefined);

  public detectFaces(
    input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
    _interval: number
  ) {
    return interval(_interval).pipe(
      mergeMap(() => (this.model && input ? from(this.predict(input)) : EMPTY))
    );
  }

  predict(
    input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
  ) {
    if (this.model) {
      return predict(
        this.model,
        input instanceof HTMLVideoElement ? Video.read(input) : input
      );
    }
    throw new Error(
      'Model must be loaded before calling the detector function... Call loadModel() before calling this detectFaces()'
    );
  }

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
