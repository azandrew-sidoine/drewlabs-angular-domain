import { DOCUMENT } from "@angular/common";
import {
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
import { filter, takeUntil, tap } from "rxjs/operators";
import { createStateful, createSubject, rxTimeout } from "../rxjs/helpers";
import { untilDestroyed } from "../rxjs/operators";
import { FaceMeshDetector, FACE_MESH } from "../tfjs";
import { FaceMeshPointsDrawerService } from "../tfjs/ng";
import { Canvas } from "../utils/browser";
import { WEBCAM, Webcam } from "../webcam";
import { Video } from "../webcam/helpers";
import { getReadInterval } from "./helpers";
import { FaceDetectionComponentState } from "./types/face-detection.component.state";

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
export class FaceDetectionComponent implements OnInit, OnDestroy {
  @Input() width: number = 320;
  @Input() height: number = 240;
  @Input() initialDevice!: string | undefined;
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

  private videoHTMLElement!: HTMLVideoElement;
  private canvasHTMLElement!: HTMLCanvasElement;

  @Input() totalFaces: number = 1;
  @Input() confidenceScore: number = 0.9;
  @Input() detectorTimeOut: number = 7000;
  @Input() noFacesDetectedTimeOut = 14000;

  private _detectFacesResult!: { size?: number; encodedURI?: string };
  @Output() detectFacesResultEvent = new EventEmitter<{
    size?: number;
    encodedURI?: string;
  }>();
  @Output() noFaceDetectedEvent = new EventEmitter<boolean>();
  @Output() videoStreamEvent = new EventEmitter<MediaStream>();
  showCameraError: boolean = false;
  @Output() stateChange = new EventEmitter<FaceDetectionComponentState>();

  _state$ = createStateful<FaceDetectionComponentState>({
    loadingCamera: false,
    loadingModel: false,
    totalFaceDetected: undefined,
    base64Data: undefined,
    hasCanvas: false,
    hasError: false,
    detecting: false,
    switchingCamera: false,
  });

  constructor(
    @Inject(WEBCAM) private camera: Webcam,
    @Inject(DOCUMENT) private document: Document,
    @Inject(FACE_MESH) private faceMeshDetector: FaceMeshDetector,
    private drawer: FaceMeshPointsDrawerService
  ) {
    // Subscribe to state changes and notify parent
    this._state$
      .asObservable()
      .pipe(
        filter((state) => typeof state !== "undefined" && state !== null),
        untilDestroyed(this, "ngOnDestroy"),
        tap((state) => {
          this.stateChange.emit(state);
        })
      )
      .subscribe();
    // Subscribe to state changes and notify parent
  }

  async ngOnInit() {
    await this.initializeComponent();
  }

  initializeComponent = (deviceID?: string) =>
    (async () => {
      this.showCameraError = false;
      this.showCanvas = false;
      // #region Initialize the Component state
      this._state$.next({
        loadingCamera: false,
        loadingModel: false,
        totalFaceDetected: undefined,
        base64Data: undefined,
        hasCanvas: false,
        hasError: false,
        detecting: false,
        switchingCamera: false,
      });
      // #endRegion
      if (this.detectorTimeOut > this.noFacesDetectedTimeOut) {
        throw new Error(
          "Detector wait time out must be less than the noFacesDetectedTimeOut input value"
        );
      }
      // Load the face detector models
      if (
        typeof this.faceMeshDetector.getModel() === "undefined" ||
        this.faceMeshDetector.getModel() === null
      ) {
        // #region Loading model
        this._state$.next({
          ...this._state$.getValue(),
          loadingModel: true,
        });
        await forkJoin([
          this.faceMeshDetector.loadModel(undefined, {
            shouldLoadIrisModel: true,
            scoreThreshold: this.confidenceScore ?? 0.9,
            maxFaces: this.totalFaces ?? 3,
          }),
        ]).toPromise();
        // #region Ended loading the model
        this._state$.next({
          ...this._state$.getValue(),
          loadingModel: false,
        });
        // #endregion Ended loading model
      }
      this.videoHTMLElement = this.videoElement
        ?.nativeElement as HTMLVideoElement;
      this.canvasHTMLElement = this.canvasElement
        ?.nativeElement as HTMLCanvasElement;

      try {
        // #region loading the camera
        this._state$.next({
          ...this._state$.getValue(),
          loadingCamera: true,
        });
        // #endregion loading the camera
        await this.camera.startCamera(
          this.videoHTMLElement,
          "custom",
          (_, dst) => {
            // #region loading the camera
            this._state$.next({
              ...this._state$.getValue(),
              loadingCamera: false,
            });
            // #endregion loading the camera
            this.videoStreamEvent.next(_);
            const image = dst;
            const canvas = this.canvasHTMLElement;
            if (image && canvas) {
              // Set a timeout to wait for before checking the detected faces
              // Notify the container component of no face detected event
              rxTimeout(() => {
                if (
                  typeof this._detectFacesResult === "undefined" ||
                  this._detectFacesResult === null
                ) {
                  // #region Timeout
                  this._state$.next({
                    ...this._state$.getValue(),
                    detecting: false,
                    totalFaceDetected: 0,
                  });
                  // #endregion Timeout
                  this.noFaceDetectedEvent.emit(true);
                }
              }, this.noFacesDetectedTimeOut)
                .pipe(takeUntil(this._destroy$))
                .subscribe();

              // Wait for certain time before detecting client faces
              rxTimeout(() => {
                // #region Timeout
                this._state$.next({
                  ...this._state$.getValue(),
                  detecting: false,
                  totalFaceDetected: this._detectFacesResult.size,
                  base64Data: this._detectFacesResult?.encodedURI,
                });
                // #endregion Timeout
                if (this._detectFacesResult) {
                  this.detectFacesResultEvent.emit(this._detectFacesResult);
                }
              }, this.detectorTimeOut)
                .pipe(takeUntil(this._destroy$))
                .subscribe();

              const interval_ = getReadInterval();
              // Run the face mesh detector as well
              // #region Detecting faces
              this._state$.next({
                ...this._state$.getValue(),
                detecting: true,
              });
              // #endregion Detecting faces
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
                        this._detectFacesResult = {
                          size: predictions?.length,
                          encodedURI: Canvas.readAsDataURL(canvas),
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
                      this.drawer.drawFacePoints(context)(predictions || []);
                    });
                  })
                )
                .subscribe();
            }
          },
          deviceID
            ? {
                width: { exact: this.width },
                height: { exact: this.height },
                deviceId: deviceID,
              }
            : {
                width: { exact: this.width },
                height: { exact: this.height },
                deviceId: this.initialDevice,
              }
        );
      } catch (error) {
        this.showCameraError = true;
        // #region Error case
        this._state$.next({
          ...this._state$.getValue(),
          hasError: true,
        });
        // #endregion Error case
      }
    })();

  async switchCamera(deviceId: string | undefined) {
    // TODO : START SWITCHING CAMERA
    this._state$.next({
      ...this._state$.getValue(),
      switchingCamera: true,
    });
    // TODO : RELOAD WEBCAM WITH FACE DETECTION VIEW
    await this.reload(deviceId);
    // TODO : END SWITCHING CAMERA
    this._state$.next({
      ...this._state$.getValue(),
      switchingCamera: false,
    });
  }

  async reload(deviceId?: string | undefined) {
    this._destroy$.next();
    await this.initializeComponent(deviceId);
  }

  ngOnDestroy(): void {
    this.camera.stopCamera();
    this._destroy$.next();
  }
}
