import { DOCUMENT } from "@angular/common";
import { Inject, Injectable, OnDestroy } from "@angular/core";
import { createStateful } from "../../rxjs/helpers";
import { NAVIGATOR } from "../../utils/ng/common";
import { OnVideoStreamHandlerFn, VideoConstraints, Webcam } from "../types";

@Injectable()
export class WebcamService implements Webcam, OnDestroy {
  private _video!: HTMLVideoElement;
  private _mediaStream!: MediaStream | undefined;
  private _onCameraStartedCallback!: OnVideoStreamHandlerFn;

  private _videoDevices$ = createStateful<MediaDeviceInfo[]>([]);
  videoDevices$ = this._videoDevices$.asObservable();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(NAVIGATOR) private navigator: Navigator
  ) {}

  onVideoCanPlay() {
    if (this._onCameraStartedCallback) {
      this._onCameraStartedCallback(this._mediaStream, this._video);

      this.navigator.mediaDevices.enumerateDevices().then((devices) => {
        this._videoDevices$.next(
          devices.filter((value) => value.kind === "videoinput")
        );
      });
    }
  }

  startCameraInHTMLElement(
    videoId: string,
    resolution: string,
    callback: OnVideoStreamHandlerFn
  ) {
    let video = <HTMLVideoElement>this.document.getElementById(videoId);
    // Create a video element
    if (!video) {
      video = this.document.createElement("video");
    }
    return this.startCamera(video, resolution, callback);
  }

  startCameraAndListenForDeviceChangesEvent = (
    video: HTMLVideoElement,
    resolution: string,
    callback: OnVideoStreamHandlerFn
  ) => {
    // Review the method implementations
    // by using observables if possible
    const promise = this.startCamera(video, resolution, callback);
    // Listen for media changes event
    this.navigator.mediaDevices.addEventListener("devicechange", (event) => {
      // this.dispose();
      this.startCamera(video, resolution, callback);
    });
    return promise;
  };

  startCamera = (
    video: HTMLVideoElement,
    resolution: string,
    callback: OnVideoStreamHandlerFn,
    customResolution?: VideoConstraints
  ) => {
    // Constraints
    const constraints: { [index: string]: VideoConstraints } = {
      qvga: {
        width: { exact: 320 },
        height: { exact: 240 },
      },
      vga: {
        width: { exact: 640 },
        height: { exact: 480 },
      },
    };
    // Get video constraints
    let videoConstraint: any = undefined;
    customResolution = customResolution ?? {};
    if (resolution === "custom") {
      videoConstraint = {
        ...customResolution,
        ...(customResolution?.deviceId
          ? {}
          : {
              facingMode: videoConstraint?.facingMode ?? "user",
            }),
      };
    } else {
      videoConstraint = constraints[resolution] ?? {
        ...customResolution,
        ...(customResolution?.deviceId
          ? {}
          : {
              facingMode: videoConstraint?.facingMode ?? "user",
            }),
      };
    }
    if (!videoConstraint) {
      videoConstraint = true;
    }
    return new Promise((resolve, reject) => {
      this.navigator.mediaDevices
        .getUserMedia({
          video: videoConstraint,
          audio: false,
        })
        .then((stream) => {
          video.srcObject = stream;
          video.play();
          this._video = video;
          this._mediaStream = stream;
          this._onCameraStartedCallback = callback;
          video.addEventListener("canplay", () => this.onVideoCanPlay(), false);
          video.addEventListener("pause", () => {
            video.play();
          });
          resolve({});
        })
        .catch((err) => {
          reject(`User camera Error: ${err.name} - ${err.message}`);
        });
    }); //
  };

  'stopCamera'(onComplete?: () => void) {
    this.dispose();
    if (onComplete) {
      onComplete();
    }
  }

  dispose = () => {
    if (this._video) {
      this._video.pause();
      this._video.srcObject = null;
      this._video.removeEventListener(
        "canplay",
        this.onVideoCanPlay.bind(this)
      );
    }
    if (this._mediaStream) {
      this._mediaStream.getTracks().forEach((track) => track.stop());
      this._mediaStream = undefined;
    }
  };
  ngOnDestroy(): void {
    if (this._video) {
      this._video.pause
    }
  }
}
