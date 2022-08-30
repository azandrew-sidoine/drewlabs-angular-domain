import { DOCUMENT } from '@angular/common';
import {
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { forkJoin, Subject } from 'rxjs';
import { filter, takeUntil, tap } from 'rxjs/operators';
import { createStateful, rxTimeout } from '../rxjs/helpers';
import { untilDestroyed } from '../rxjs/operators';
import { FaceMeshDetector, FACE_MESH, FaceLandmarkPreditions } from '../tfjs';
import { FaceMeshPointsDrawerService } from '../tfjs/ng';
import { Canvas } from '../utils/browser';
import { WEBCAM, Webcam } from '../webcam';
import { Video } from '../webcam/helpers';
import { deviceConstraintFactory, getReadInterval } from './helpers';
import {
  FaceDetectionComponentState,
  FacePredictionsType,
} from './types';

@Component({
  selector: 'app-face-detection',
  templateUrl: './face-detection.component.html',
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
  @Input() autostart: boolean = true;
  @Input() drawBox: boolean = false;
  @Input() lightPath: boolean = false;

  @ViewChild('videoElement') videoElement!: ElementRef;
  @ViewChild('canvasElement') canvasElement!: ElementRef;
  @ViewChild('outputImage') outputImage!: ElementRef;
  @ViewChild('sceneImage') sceneImage!: ElementRef;

  private _destroy$ = new Subject<void>();
  private _timeout$ = new Subject<void | number>();
  private _timeout = false;
  @Output() public frontFaceDataURI = new EventEmitter<string>();
  @Output() public profilFaceDataURI = new EventEmitter<string>();

  @Input() profilFaceHaarCascadeURL: string =
    '/assets/resources/vendor/haarcascade_profileface.xml';

  private videoHTMLElement!: HTMLVideoElement;
  private canvasHTMLElement!: HTMLCanvasElement;

  @Input() confidenceScore: number = 0.95;
  @Input() timeout: number = 7000;

  @Output() videoStreamEvent = new EventEmitter<MediaStream>();
  @Output() stateChange = new EventEmitter<FaceDetectionComponentState>();
  @ContentChild('startFaceDetection') startFaceDetectionRef!: TemplateRef<any>;

  _state$ = createStateful<FaceDetectionComponentState>({
    loadingCamera: false,
    loadingModel: false,
    hasCanvas: false,
    hasError: false,
    detecting: false,
    switchingCamera: false,
    loadedModel: false,
    predictions: [],
  });
  state$ = this._state$.asObservable();

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
        filter((state) => typeof state !== 'undefined' && state !== null),
        untilDestroyed(this, 'ngOnDestroy'),
        tap((state) => {
          this.stateChange.emit(state);
        })
      )
      .subscribe();
    // Subscribe to state changes and notify parent
  }

  async ngOnInit() {
    await this.initializeComponent();
    if (this.autostart) {
      this.runFaceDetection();
    }
  }

  async initializeComponent(deviceID?: string) {
    // #region Initialize the Component state
    this.setState({
      loadingCamera: false,
      loadingModel: false,
      hasCanvas: false,
      hasError: false,
      detecting: false,
      switchingCamera: false,
      predictions: [],
    });
    // #endRegion
    // Load the face detector models
    const model = this.faceMeshDetector.getModel();
    if (typeof model === 'undefined' || model === null) {
      // #region Loading model
      this.setState({ loadingModel: true });
      await forkJoin([
        this.faceMeshDetector.loadModel(undefined, {
          shouldLoadIrisModel: true,
          detectionConfidence: this.confidenceScore,
          // scoreThreshold: this.confidenceScore ?? 0.95,
          // maxFaces: this.totalFaces ?? 3,
        }),
      ]).toPromise();
      // #region Ended loading the model
      this.setState({ loadingModel: false, loadedModel: true });
      // #endregion Ended loading model
    }
    this.videoHTMLElement = this.videoElement?.nativeElement;
    this.canvasHTMLElement = this.canvasElement?.nativeElement;
  }

  async runFaceDetection(deviceID?: string) {
    try {
      // #region loading the camera
      this.setState({ loadingCamera: true });
      // #endregion loading the camera
      await this.camera.startCamera(
        this.videoHTMLElement,
        'custom',
        (_, dst) => {
          // #region loading the camera
          this.setState({ loadingCamera: false, hasCanvas: true });
          // #endregion loading the camera
          this.videoStreamEvent.next(_);
          const image = dst as HTMLVideoElement;
          if (image && this.canvasHTMLElement) {
            // Wait for certain time before detecting client faces
            rxTimeout(() => {
              // #region Timeout
              this.setState({ detecting: false });
              // #endregion Timeout
            }, this.timeout)
              .pipe(
                takeUntil(this._destroy$),
                tap(() => {
                  this._timeout = true;
                  this._timeout$.next();
                })
              )
              .subscribe();
            const interval_ = getReadInterval();
            // Run the face mesh detector as well
            // #region Detecting faces
            this.setState({ detecting: true });
            // #endregion Detecting faces
            this.faceMeshDetector
              .detectFaces(image, interval_)
              .pipe(
                takeUntil(this._destroy$),
                tap((result) =>
                  this.drawFacePredictions(
                    image,
                    this.canvasHTMLElement,
                    result,
                    this.mergePreditions.bind(this)
                  )
                )
              )
              .subscribe();
          }
        },
        deviceConstraintFactory(deviceID)(
          this.width,
          this.height,
          this.initialDevice
        )
      );
    } catch (error) {
      // #region Error case
      this.setState({ hasError: true });
      // #endregion Error case
    }
  }

  /**
   *
   * @param deviceId
   */
  async switchCamera(deviceId: string | undefined) {
    // TODO : START SWITCHING CAMERA
    this.setState({ switchingCamera: true });
    // TODO : RELOAD WEBCAM WITH FACE DETECTION VIEW
    await this.reload(deviceId);
    // TODO : END SWITCHING CAMERA
    this.setState({ switchingCamera: false });
  }

  /**
   *
   * @param deviceId
   */
  async reload(deviceId?: string | undefined) {
    this._timeout$.next();
    this._destroy$.next();
    this._timeout = false;
    await this.initializeComponent(deviceId);
    this.runFaceDetection();
  }

  private setState(state: Partial<FaceDetectionComponentState>) {
    const currentState = this._state$.getValue();
    this._state$.next({ ...currentState, ...state });
  }

  private mergePreditions(predition: FacePredictionsType) {
    if (!this._timeout) {
      const currentState = this._state$.getValue();
      const predictions = [...(currentState.predictions ?? []), predition];
      this._state$.next({ ...currentState, predictions });
    }
  }

  private drawFacePredictions<
    T extends HTMLVideoElement = HTMLVideoElement,
    TCanvas extends HTMLCanvasElement = HTMLCanvasElement
  >(
    image: T,
    canvasElement: TCanvas,
    predictions: FaceLandmarkPreditions[] | undefined,
    callbackRef: (state: FacePredictionsType) => void
  ) {
    requestAnimationFrame(() => {
      const canvas = Video.writeToCanvas(image, canvasElement);
      if (predictions && predictions.length > 0) {
        callbackRef({
          value: predictions,
          image: Canvas.readAsDataURL(canvas),
        });
      }
      const context = canvasElement.getContext('2d') || undefined;
      this.drawer.drawFacePoints(context)(
        predictions || [],
        '#f3da7f',
        this.drawBox,
        this.lightPath
      );
    });
  }

  canvasCss(state: FaceDetectionComponentState) {
    return state.hasCanvas && !state.hasError
      ? 'not-hidden-canvas text-center'
      : 'hidden-canvas text-center';
  }

  ngOnDestroy(): void {
    this._timeout$.next();
    this._destroy$.next();
    this.camera.stopCamera();
  }
}
