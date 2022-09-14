import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, OnDestroy } from '@angular/core';
import { createStateful } from '../../rxjs/helpers';
import { NAVIGATOR } from '../../utils/ng/common';
import { OnVideoStreamHandlerFn, VideoConstraints, Webcam } from '../types';

@Injectable()
export class WebcamService implements Webcam, OnDestroy {
  private videoElement!: HTMLVideoElement | null;
  private mediaStream!: MediaStream | undefined;
  private onVideoStreamCallback!: OnVideoStreamHandlerFn;

  private _videoDevices$ = createStateful<MediaDeviceInfo[]>([]);
  videoDevices$ = this._videoDevices$.asObservable();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(NAVIGATOR) private navigator: Navigator
  ) {}

  onVideoCanPlay() {
    if (this.onVideoStreamCallback) {
      this.onVideoStreamCallback(this.mediaStream, this.videoElement);

      this.navigator.mediaDevices.enumerateDevices().then((devices) => {
        this._videoDevices$.next(
          devices.filter((value) => value.kind === 'videoinput')
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
      video = this.document.createElement('video');
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
    this.navigator.mediaDevices.addEventListener('devicechange', (event) => {
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
    if (resolution === 'custom') {
      videoConstraint = {
        ...customResolution,
        ...(customResolution?.deviceId
          ? {}
          : {
              facingMode: videoConstraint?.facingMode ?? 'user',
            }),
      };
    } else {
      videoConstraint = constraints[resolution] ?? {
        ...customResolution,
        ...(customResolution?.deviceId
          ? {}
          : {
              facingMode: videoConstraint?.facingMode ?? 'user',
            }),
      };
    }
    if (!videoConstraint) {
      videoConstraint = true;
    }
    return new Promise<void>((resolve, reject) => {
      this.navigator.mediaDevices
        .getUserMedia({
          video: videoConstraint,
          audio: false,
        })
        .then((stream) => {
          video.srcObject = stream;
          video.play();
          this.videoElement = video;
          this.mediaStream = stream;
          this.onVideoStreamCallback = callback;
          // this.videoElement.disablePictureInPicture = true;
          video.addEventListener('canplay', this.onVideoCanPlay.bind(this), false);
          video.addEventListener('pause', () => video.play());
          resolve();
        })
        .catch((err) => {
          reject(`User camera Error: ${err.name} - ${err.message}`);
        });
    }); //
  };

  stopCamera(onComplete?: () => void) {
    this.dispose();
    if (onComplete) {
      onComplete();
    }
  }

  async dispose() {
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      this.videoElement.removeEventListener('canplay',this.onVideoCanPlay.bind(this));
      this.videoElement = null;
    }
    if (this.mediaStream && this.mediaStream.active) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream.getVideoTracks().forEach(track => track.stop());
      this.mediaStream = undefined;
    }
  }

  ngOnDestroy(): void {
    this.dispose();
  }
}
