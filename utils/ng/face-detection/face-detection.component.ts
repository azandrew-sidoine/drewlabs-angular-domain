import { DOCUMENT } from "@angular/common";
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { forkJoin } from "rxjs";
import { takeUntil, tap } from "rxjs/operators";
import { createSubject } from "src/app/lib/core/rxjs/helpers";
import { Canvas } from "../../browser";
import {
  FaceMeshDetectorService,
  FaceMeshPointsDrawerService,
} from "../../tfjs";
import { BlazeFaceDetectorService } from "../../tfjs/ng/blazeface.service";
import { isDefined } from "../../types";
import { Video } from "../webcam/helpers";
import { UserCameraService } from "../webcam/user-camera.service";
import { getReadInterval } from "./helpers";

declare var cv: any;

@Component({
  selector: "app-face-detection",
  templateUrl: "./face-detection.component.html",
  styles: [
    `
      .hidden-video {
        display: none;
      }
      .not-hidden-canvas {
        display: block;
      }
      .hidden-canvas {
        display: none;
      }
    `,
  ],
})
export class FaceDetectionComponent
  implements OnInit, AfterViewInit, OnDestroy {
  @Input() width: number = 320;
  @Input() height: number = 240;
  public showCanvas = false;

  @ViewChild("videoElement") videoElement!: ElementRef;
  @ViewChild("canvasElement") canvasElement!: ElementRef;
  @ViewChild("outputImage") outputImage!: ElementRef;
  @ViewChild("sceneImage") sceneImage!: ElementRef;

  private _destroy$ = createSubject();
  @Output() public frontFaceDataURI = new EventEmitter<string>();
  @Output() public profilFaceDataURI = new EventEmitter<string>();

  @Input() profilFaceHaarCascadeURL: string =
    "/assets/resources/vendor/haarcascade_profileface.xml";

  // private _detectLeftFace$ = createSubject<{ image: HTMLVideoElement | undefined, canvas: HTMLCanvasElement | undefined }>();

  private videoHTMLElement!: HTMLVideoElement;
  private canvasHTMLElement!: HTMLCanvasElement;

  @Input() totalFaces: number = 1;
  @Input() confidenceScore: number = 0.9;
  @Input() detectorTimeOut: number = 10000;
  @Input() noFacesDetectedTimeOut = 20000;

  private _detectFacesResult!: { size?: number; encodedURI?: string, videoURI?: any };
  @Output() detectFacesResultEvent = new EventEmitter<{
    size?: number;
    encodedURI?: string;
  }>();
  @Output() noFaceDetectedEvent = new EventEmitter<boolean>();

  showCameraError: boolean = false;

  constructor(
    private cameraService: UserCameraService,
    private faceDetector: BlazeFaceDetectorService,
    @Inject(DOCUMENT) private document: Document,
    private faceMeshDetector: FaceMeshDetectorService,
    private faceMeshDrawer: FaceMeshPointsDrawerService
  ) { }

  async ngOnInit() {
    await this.initializeComponent();
  }

  async ngAfterViewInit() { }

  initializeComponent = (paramDeviceId = null) =>
    (async () => {
      this.showCameraError = false;
      this.showCanvas = false;
      if (this.detectorTimeOut > this.noFacesDetectedTimeOut) {
        throw new Error(
          "Detector wait time out must be less than the noFacesDetectedTimeOut input value"
        );
      }
      // Load the face detector models
      if (!isDefined(this.faceMeshDetector.model)) {
        await forkJoin([
          this.faceMeshDetector.loadModel(undefined, {
            shouldLoadIrisModel: true,
            scoreThreshold: this.confidenceScore || 0.9,
            maxFaces: this.totalFaces || 3,
          }),
        ]).toPromise();
      }
      this.videoHTMLElement = this.videoElement
        .nativeElement as HTMLVideoElement;
      this.canvasHTMLElement = this.canvasElement
        .nativeElement as HTMLCanvasElement;

      try {
        await this.cameraService.startCamera(
          this.videoHTMLElement,
          "custom",
          (_, dst) => {
            const image = dst;
            const canvas = this.canvasHTMLElement;
            if (image && canvas) {
              // Set a timeout to wait for before checking the detected faces
              // Notify the container component of no face detected event
              const timeout = setTimeout(() => {
                if (!isDefined(this._detectFacesResult)) {
                  this.noFaceDetectedEvent.emit(true);
                }
              }, this.noFacesDetectedTimeOut);

              // Wait for certain time before detecting client faces
              setTimeout(() => {
                if (this._detectFacesResult) {
                  this.detectFacesResultEvent.emit(this._detectFacesResult);
                  clearTimeout(timeout);
                }
              }, this.detectorTimeOut);

              /* video recorder stuff */
              let recordedChunks = [];
              let stream = Canvas.getStream(canvas);
              let videoURI = null;
              let mediaRecorder = new MediaRecorder(stream, {
                mimeType: "video/webm; codecs=vp9"
              });

              mediaRecorder.start(2000);
              mediaRecorder.ondataavailable = (event) => {
                recordedChunks.push(event.data);
                // after stop `dataavilable` event run one more time
                // if (mediaRecorder.state === 'recording') {
                //   mediaRecorder.stop();
                // }
              }

              // mediaRecorder.onstop = (event) => {
              //   let blob = new Blob(recordedChunks, { type: "video/webm" });
              //   videoURI = URL.createObjectURL(blob);
              // }
              /* video recorder stuff */

              const interval_ = getReadInterval();
              // Run opencv face detector
              // Run the face mesh detector as well
              this.faceMeshDetector
                .detectFaces(image as HTMLVideoElement, interval_)
                .pipe(
                  takeUntil(this._destroy$),
                  tap((predictions) => {
                    requestAnimationFrame(() => {
                      const canvas = Video.writeToCanvas(
                        image as HTMLVideoElement,
                        this.canvasElement.nativeElement as HTMLCanvasElement
                      );
                      if (
                        predictions?.length === this.totalFaces &&
                        predictions[0].faceInViewConfidence >=
                        this.confidenceScore
                      ) {
                        let blob = new Blob(recordedChunks, { type: "video/webm" });
                        let reader = new FileReader();
                        reader.readAsDataURL(blob);
                        reader.onloadend = () => {
                          videoURI = reader.result;
                          // console.log(videoURI);
                        }
                        // videoURI = URL.createObjectURL(blob);
                        this._detectFacesResult = {
                          size: predictions?.length,
                          encodedURI: Canvas.readAsDataURL(canvas),
                          videoURI: videoURI
                        };
                      }
                      const context =
                        (
                          this.canvasElement.nativeElement as HTMLCanvasElement
                        ).getContext("2d") || undefined;
                      if (!this.showCanvas) {
                        this.showCanvas = true;
                      }
                      // Draw mesh
                      this.faceMeshDrawer.drawFacePoints(context)(
                        predictions || []
                      );
                    });
                  })
                )
                .subscribe();
            }
          },
          paramDeviceId == null
            ? {
              width: { exact: this.width },
              height: { exact: this.height },
            }
            : {
              width: { exact: this.width },
              height: { exact: this.height },
              deviceId: paramDeviceId,
            }
        );
      } catch (error) {
        this.showCameraError = true;
      }
    })();

  detectProfilFace() {
    // this._detectLeftFace$.next({ image: this.videoHTMLElement, canvas: this.canvasHTMLElement });
  }

  onFacePointDetected = (image: HTMLVideoElement, state: any) =>
    (() => {
      const canvas = this.document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (context) {
        const { videoWidth, videoHeight } = image;
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        const x = state?.x;
        const y = state?.y;
        const stateWith = state?.width;
        const stateHeight = state?.height + 12;
        context?.drawImage(image, 0, 0);
        context.lineWidth = 1;
        context.strokeStyle = "green";
        context.strokeRect(x, y, stateWith, stateHeight);
        const frontalFaceLandMarks = canvas.toDataURL();
        return frontalFaceLandMarks;
      }
      return undefined;
    })();

  ngOnDestroy(): void {
    this._destroy$.next();
    this.faceDetector.deleteModel();
    this.faceMeshDetector.deleteModel();
    this.cameraService.stopCamera();
  }
}
