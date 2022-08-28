import { FaceLandmarkPreditions } from '../../tfjs';

export type FacePredictionsType = {
  value: FaceLandmarkPreditions[];
  image: string; // base64 encoded image
};
export interface FaceDetectionComponentState {
  loadingModel: boolean;
  loadedModel: boolean;
  loadingCamera: boolean;
  hasCanvas: boolean;
  hasError: boolean;
  detecting: boolean;
  switchingCamera?: boolean;
  predictions: FacePredictionsType[];
}

export type DetectedFacesStateType = {
  size?: number;
  encodedURI?: string;
};
