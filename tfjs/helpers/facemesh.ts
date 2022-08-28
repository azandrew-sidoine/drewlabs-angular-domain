import * as m from '@tensorflow-models/face-landmarks-detection';
import {
  FaceLandmarksPrediction,
  SupportedPackages,
} from '@tensorflow-models/face-landmarks-detection';
import { FaceLandmarksModelConfig } from '../types';

/**
 * Load the facelandmarks detector model
 * @param type
 */
export async function loadModel(
  type?: SupportedPackages,
  config: FaceLandmarksModelConfig = { shouldLoadIrisModel: true }
) {
  return await m.load(type || m.SupportedPackages.mediapipeFacemesh, {
    ...config,
    shouldLoadIrisModel: config?.shouldLoadIrisModel || true,
  });
}

/**
 * Predict face points using Face mesh model
 * @param model
 * @param element
 */
export async function predict<
  T extends
    | HTMLVideoElement
    | HTMLCanvasElement
    | HTMLImageElement
    | ImageData
    | undefined
>(model: m.FaceLandmarksDetector, element: T) {
  return new Promise<FaceLandmarksPrediction[] | undefined>((resolve, _) => {
    if (element) {
      resolve(model.estimateFaces({ input: element as any }));
    } else {
      resolve([]);
    }
  });
}

/**
 * Estimates face points on an HTML{Video|Canvas|Image}Element
 * @param element
 */
export async function estimateFaces<
  T extends HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
>(element: T) {
  return await predict(await loadModel(), element);
}
