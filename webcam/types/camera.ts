import { Observable } from "rxjs";
import { VideoConstraints } from "./constraints";

export type OnVideoStreamHandlerFn = (
  source: MediaStream,
  dest: HTMLVideoElement
) => void;

/**
 * @description Type definition of a web camservice
 */
export interface Webcam {

  videoDevices$: Observable<MediaDeviceInfo[]>;

  startCamera(
    video: any,
    resolution: string,
    callback: OnVideoStreamHandlerFn,
    fallbackResolution?: VideoConstraints
  ): Promise<any> | Observable<any>;

  stopCamera(onComplete?: () => void): Promise<void> | void;
}
