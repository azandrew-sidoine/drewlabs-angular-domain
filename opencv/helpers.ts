declare var cv: any;

/**
 * Logger error while working with OpenCV
 * @param cv OpenCV instance
 * @param err Error While working with open CV
 */
export const logError = (cv: any, err: any) => {
  if (typeof err === 'undefined') {
    err = '';
  } else if (typeof err === 'number') {
    if (!isNaN(err)) {
      if (typeof cv !== 'undefined') {
        err = 'Exception: ' + cv.exceptionFromPtr(err).msg;
      }
    }
  } else if (typeof err === 'string') {
    const ptr = Number(err.split(' ')[0]);
    if (!isNaN(ptr)) {
      if (typeof cv !== 'undefined') {
        err = 'Exception: ' + cv.exceptionFromPtr(ptr).msg;
      }
    }
  } else if (err instanceof Error) {
    err = err.stack?.replace(/\n/g, '<br>');
  }
  throw new Error(err);
};

export const drawRectStroke =
  (facePoints: { x: number; y: number; width: number; height: number }[]) =>
  (context?: CanvasRenderingContext2D, color?: string) => {
    if (context) {
      facePoints.forEach(({ x, y, width, height }) => {
        if (x && y && width && height) {
          context.strokeStyle = color ?? 'green';
          context.strokeRect(x, y, width, height);
        }
      });
    }
  };
