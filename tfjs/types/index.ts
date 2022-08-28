export { BLAZE_FACE, FACE_MESH } from './tokens';
export {
  FaceMeshDetector,
  FaceLandmarksModelConfig,
  TypeFaceMeshDetector,
  TypeFaceMeshPrediction,
  TypeSupportedPackages,
} from './facemesh';
export {
  BlazeFaceDetector,
  BlazeModelConfig,
  TypeBlazeDetector,
  TypeBlazePrediction,
} from './blazeface';

export { FaceLandmarkPreditions } from './face-landmarks';

export type FacePointsType = {
  x: number;
  y: number;
  width: number;
  height: number;
};
