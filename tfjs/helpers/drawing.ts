import { FaceLandmarksPrediction } from '@tensorflow-models/face-landmarks-detection';
import { FacePointsType } from '../types';
import { TRIANGULATION } from './constants';

// Triangle drawing method
function drawPath(
  context: CanvasRenderingContext2D,
  points: number[][],
  closePath: boolean = true,
  color?: string
) {
  const region = new Path2D();
  region.moveTo(points[0][0], points[0][1]);

  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    region.lineTo(point[0], point[1]);
  }

  if (closePath) {
    region.closePath();
  }
  context.strokeStyle = color ?? 'grey';
  context.stroke(region);
}

/**
 * Draw a face points prediction mesh on a Rendering context
 *
 * @param predictions
 * @param context
 */
export const drawMesh = (
  predictions: FaceLandmarksPrediction[],
  context?: CanvasRenderingContext2D,
  color?: string
) => {
  if (predictions.length > 0 && context) {
    predictions.forEach((prediction) => {
      const keypoints = (prediction.scaledMesh || [[], []]) as any[];
      const boundingBox = prediction?.boundingBox;

      // Draw the bounding box
      const [x, y] = boundingBox.topLeft as [number, number];
      const [dx, dy] = boundingBox.bottomRight as [number, number];
      const [width, height] = [dx - x, dy - y];
      const box = { x, y, width, height };
      // drawRect([box])(context || undefined, color);

      // // //  Draw Triangles
      for (let i = 0; i < TRIANGULATION.length / 3; i++) {
        // Get sets of three keypoints for the triangle
        const points = [
          TRIANGULATION[i * 3],
          TRIANGULATION[i * 3 + 1],
          TRIANGULATION[i * 3 + 2],
        ].map((index) => keypoints[index]);
        //  Draw triangle
        drawPath(context, points, true, color);
      }

      // Draw Dots
      for (let i = 0; i < keypoints.length; i++) {
        const x = keypoints[i][0];
        const y = keypoints[i][1];
        context.beginPath();
        context.arc(x, y, 1 /* radius */, 0, 3 * Math.PI);
        context.fillStyle = color ?? 'aqua';
        context.fill();
      }
    });
  }
};

/**
 *
 * @param facePoints
 */
export function drawRect(facePoints: FacePointsType[]) {
  return (context?: CanvasRenderingContext2D, color?: string) => {
    if (context) {
      facePoints.forEach(({ x, y, width, height }) => {
        if (x && y && width && height) {
          context.strokeStyle = color ?? 'green';
          context.strokeRect(x, y, width, height);
        }
      });
    }
  };
}
