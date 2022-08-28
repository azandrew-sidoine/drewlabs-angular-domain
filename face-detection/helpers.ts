export const getReadInterval = (fps: number = 30) => {
  const start = Date.now();
  const _fps = 5000 / fps;
  const time = Date.now() - start;
  const interval = _fps - time;
  return interval;
};


/**
 * Creates a camera device contraints factory function
 *
 * @param device
 */
export function deviceConstraintFactory(device?: string) {
  return (width: number, height: number, initial?: string) =>
    device
      ? {
          width: { exact: width },
          height: { exact: height },
          deviceId: device,
        }
      : {
          width: { exact: width },
          height: { exact: height },
          deviceId: initial,
        };
}
