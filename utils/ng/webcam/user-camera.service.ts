import { DOCUMENT } from "@angular/common";
import { Inject, Injectable } from "@angular/core";
import { Log } from "../../logger";
import { NAVIGATOR } from "../common/tokens/navigator";
import { OnStartUserCameraHandlerFn, VideoConstraints } from "./types/user-camera";

@Injectable({
    providedIn: 'root'
})
export class UserCameraService {

    private _video!: HTMLVideoElement;
    private _mediaStream!: MediaStream|undefined;
    private _onCameraStartedCallback!: OnStartUserCameraHandlerFn;


    constructor(
        @Inject(DOCUMENT) private document: Document,
        @Inject(NAVIGATOR) private navigator: Navigator
    ) { }


    onVideoCanPlay() {
        if (this._onCameraStartedCallback) {
            this._onCameraStartedCallback(this._mediaStream, this._video);
        }
    }

    startCameraInHTMLElement(
        videoId: string,
        resolution: string,
        callback: OnStartUserCameraHandlerFn,
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
        callback: OnStartUserCameraHandlerFn
    ) => {
        // Review the method implementations
        // by using observables if possible
        const promise = this.startCamera(video, resolution, callback);
        // Listen for media changes event
        this.navigator.mediaDevices.addEventListener('devicechange', (event) => {
            this.dispose();
            this.startCamera(video, resolution, callback);
        });
        return promise;
    }

    startCamera = (
        video: HTMLVideoElement,
        resolution: string,
        callback: OnStartUserCameraHandlerFn,
        customResolution?: { width: { exact: number }, height: { exact: number } }
    ) => {

        const constraints: VideoConstraints = {
            qvga: { width: { exact: 320 }, height: { exact: 240 } },
            vga: { width: { exact: 640 }, height: { exact: 480 } }
        };
        // Get video constraints
        let videoConstraint: any = undefined;
        if (resolution === 'custom') {
            videoConstraint = customResolution;
        } else {
            videoConstraint = constraints[resolution] || customResolution;
        }
        if (!videoConstraint) {
            videoConstraint = true;
        }
        Log('Starting camera...');
        return new Promise((resolve, reject) => {
            this.navigator.mediaDevices
                .getUserMedia({ video: videoConstraint, audio: false })
                .then(stream => {
                    video.srcObject = stream;
                    video.play();
                    this._video = video;
                    this._mediaStream = stream;
                    this._onCameraStartedCallback = callback;
                    video.addEventListener('canplay', this.onVideoCanPlay.bind(this), false);
                    resolve({});
                })
                .catch(err => {
                    reject(`User camera Error: ${err.name} - ${err.message}`);
                });
        }); //
    }



    stopCamera() {
        this.dispose();
    }

    dispose = () => {
        if (this._video) {
            this._video.pause();
            this._video.srcObject = null;
            this._video.removeEventListener('canplay', this.onVideoCanPlay.bind(this));
        }
        if (this._mediaStream) {
            this._mediaStream.getVideoTracks().forEach(track => track.stop());
            this._mediaStream.getAudioTracks().forEach(track => track.stop());
            this._mediaStream = undefined;
        }
    }
}
