import {
  FaceLandmarksDetector,
  FaceLandmarksPrediction,
  SupportedPackages,
} from '@tensorflow-models/face-landmarks-detection';
import { Observable } from 'rxjs';
import { FaceLandmarkPreditions } from './face-landmarks';
import { MLModelProvider } from './model';

export interface FaceLandmarksModelConfig {
  detectionConfidence?: number;
  maxFaces?: number;
  scoreThreshold?: number;
  shouldLoadIrisModel: boolean;
}

export type TypeFaceMeshDetector = FaceLandmarksDetector;
export type TypeSupportedPackages = SupportedPackages;
export type TypeFaceMeshPrediction = FaceLandmarksPrediction;

export interface FaceMeshDetector extends MLModelProvider {
  loadModel(
    type?: SupportedPackages,
    config?: FaceLandmarksModelConfig
  ): Observable<FaceLandmarksDetector>;

  deleteModel(): void | Promise<void>;

  detectFaces(
    input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
    _interval: number
  ): Observable<FaceLandmarkPreditions[] | undefined>;

  predict(
    input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
  ): Promise<FaceLandmarkPreditions[] | undefined>;
}
