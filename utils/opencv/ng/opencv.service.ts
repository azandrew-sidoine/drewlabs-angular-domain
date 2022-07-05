import { DOCUMENT } from "@angular/common";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Inject, Injectable, OnDestroy } from "@angular/core";
import { interval, Observable, Subject, throwError } from "rxjs";
import { catchError, map, mergeMap, takeUntil, tap, } from "rxjs/operators";
import { createStateful, createSubject, observableFrom } from "../../../rxjs/helpers";
import { doLog } from "../../../rxjs/operators";
import { WINDOW } from "../../ng/common/tokens/window";
import { isDefined, setObjectProperty } from "../../types";
import { OPENCV_DEFAULT_LOAD_RESULT } from "../constants/load-result";
import { OPENCV_DEFAULT_OPTIONS } from "../constants/options";
import { drawRectStroke, logError } from "../helpers";
import { OpenCVLoadResult, OpenCVOptions } from "../types/open-cv";
import { OPENCV_CONFIG_OPTIONS } from "./tokens";

declare var cv: any;


export type FaceDetectorHandlerFn = (
  classifier: any,
  canvas: any,
  src: any,
  dst: any,
  gray: any,
  cap: any,
  faces: any,
  publisher$: Subject<any>,
  FPS?: number) => Promise<void>;

export interface OpenCVProviderInterface {
  loadOpenCV(name: string, path: string): Observable<any>;
}

// export class Utils {

//     static getContours = (
//         src: any,
//         dest1: any,
//         dest3: any,
//         dest4: any,
//         width: number,
//         height: number
//     ) => {
//         cv.cvtColor(src, dest1, cv.COLOR_RGBA2GRAY);
//         cv.threshold(dest1, dest4, 120, 200, cv.THRESH_BINARY);
//         const contours = new cv.MatVector();
//         const hierarchy = new cv.Mat();
//         cv.findContours(dest4, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE, {
//             x: 0,
//             y: 0
//         });
//         dest3.delete();
//         dest3 = cv.Mat.ones(height, width, cv.CV_8UC3);
//         for (let i = 0; i < contours.size(); ++i) {
//             const color = new cv.Scalar(0, 255, 0);
//             cv.drawContours(dest3, contours, i, color, 1, cv.LINE_8, hierarchy);
//         }
//         contours.delete();
//         hierarchy.delete();
//         return dest3;
//     }
// }


@Injectable({
  providedIn: 'root'
})
export class OpenCVSvervice implements OpenCVProviderInterface {

  private _readyState$ = createStateful<OpenCVLoadResult>(OPENCV_DEFAULT_LOAD_RESULT);

  get readyState$() {
    return this._readyState$;
  }

  private _compiledLibraryURL!: string;

  constructor(
    @Inject(OPENCV_CONFIG_OPTIONS) options: OpenCVOptions,
    @Inject(WINDOW) private window: Window,
    @Inject(DOCUMENT) private document: Document,
    private _httpClient: HttpClient
  ) {
    this._compiledLibraryURL = options?.scriptUrl || this._compiledLibraryURL;
    this.loadLibrary({ ...OPENCV_DEFAULT_OPTIONS, ...options });
  }

  public loadLibrary = (options: OpenCVOptions) => {
    if (isDefined(cv)) {
      this._onScriptLoaded(options);
    } else {
      this.window = setObjectProperty(this.window, 'Module', { ...options });
      const script = this.document.createElement('script');
      script.setAttribute('async', '');
      script.setAttribute('type', 'text/javascript');
      script.addEventListener('load', () => this._onScriptLoaded(options));
      script.addEventListener('error', () => {
        const err = logError(cv, 'Failed to load ' + this._compiledLibraryURL);
        this.readyState$.next({
          ready: false,
          hasError: true,
          loading: false
        });
        this._readyState$.error(err);
      });
      script.src = this._compiledLibraryURL;
      const node = this.document.getElementsByTagName('script')[0];
      if (node) {
        node.parentNode?.insertBefore(script, node);
      } else {
        this.document.head.appendChild(script);
      }
    }
  }

  private _onScriptLoaded = (options: OpenCVOptions) => {
    const onRuntimeInitializedCallback = () => {
      if (options.onRuntimeInitialized) {
        options.onRuntimeInitialized();
      }
      this._readyState$.next({
        ready: true,
        hasError: false,
        loading: false
      });
    };
    cv.onRuntimeInitialized = onRuntimeInitializedCallback;
  }

  loadOpenCV = (name: string, path: string) => {
    return this._httpClient.get(path, {
      headers: new HttpHeaders().append('Content-Type', 'application/xml'),
      responseType: 'arraybuffer'
    }).pipe(
      map(result => {
        const classifier = new cv.CascadeClassifier();
        cv.FS_createDataFile('/', name, new Uint8Array(result), true, true, false);
        classifier.load(name);
        return classifier;
      }),
      catchError(err => {
        logError(cv, err);
        return throwError(err);
      })
    )
  }

  loadImageToHTMLCanvas = (id: string, buffer: string) => {
    const canvas: HTMLCanvasElement = <HTMLCanvasElement>this.document.querySelector(id) as HTMLCanvasElement;
    return this.loadImageToCanvas(canvas, buffer);
  };

  public loadImageToCanvas = (canvas: HTMLCanvasElement, buffer: string) => {
    return observableFrom(new Promise<{}>((resolve, reject) => {
      // Get 2d context
      const context = canvas.getContext('2d');
      const image = new Image();
      image.crossOrigin = 'anonymous';

      image.onload = () => {
        const { width, height } = image;
        canvas.width = width,
          canvas.height = height;
        context?.drawImage(image, 0, 0, width, height);
        resolve({});
      };
      image.src = buffer;
    }));
  }

}


@Injectable({
  providedIn: 'root'
})
export class OpenCVFaceDetectorService implements OnDestroy {

  public readonly _cleanResources$ = createSubject<{}>();
  private _destroy$ = createSubject();
  private ressources: any[] = [];

  // Classifier
  private _model: any;
  get model() {
    return this._model;
  }

  constructor(private service: OpenCVSvervice) {
    this._cleanResources$.pipe(
      takeUntil(this._destroy$),
      tap(_ => {
        this.cleanup();
      })
    ).subscribe();
  }

  cleanup = () => {
    this.ressources.filter(item => {
      return isDefined(item);
    }).forEach(resource => {
      try {
        resource.delete();
      } catch (error) { }
    });
  }

  deleteModel = () => {
    if (this._model) {
      this._model.delete();
      this._model = undefined;
    }
    return this;
  }

  private detectFace = async (
    classifier: any,
    src: any,
    dst: any,
    gray: any,
    cap: any,
    faces: any
  ) => {

    try {
      cap.read(src);
      src.copyTo(dst);
      cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY, 0);
      // TODO: Draw face points
      classifier.detectMultiScale(gray, faces, 1.1, 3, 0, new cv.Size(75, 75));
      // TODO : Draw faces
      const totalFaces: number = faces?.size();
      // Creates a variable that holds the result
      let result: { points?: { x: number, y: number, width: number, height: number }[], totalFaces: number } = { totalFaces };
      const points = Array.from(Array(totalFaces).keys()).map((key) => {
        const face = faces.get(+key);
        const x = face.x;
        const y = face.y;
        const width = face.width;
        const height = face.height;
        return { x, y, width, height };
      });
      return { ...result, points };
    } catch (err) {
      logError(cv, err);
      return { totalFaces: 0, points: undefined };
    }
  }

  loadModel = (
    haarclassifier: string,
    url: string) => this.service.loadOpenCV(haarclassifier, url)
      .pipe(
        tap(classifier => {
          this._model = classifier;
        }),
        catchError(err => {
          return throwError(err);
        })
      );

  detectFaceOnVideoStream = (
    video: HTMLVideoElement,
    _interval: number
  ) => (intializerFn: () => void) => {

    if (!isDefined(this.model)) {
      throw new Error('Model must be loaded before calling the detector function... Call loadModel() before calling this detectFaces()');
    }
    // Reset the ressources
    intializerFn();
    // Prepare for face detection
    const { width, height } = video;
    let src = new cv.Mat(height, width, cv.CV_8UC4);
    const dst = new cv.Mat(height, width, cv.CV_8UC4);
    const gray = new cv.Mat();
    let cap = new cv.VideoCapture(video);
    let faces = new cv.RectVector();
    let eyes = new cv.RectVector();
    this.ressources = [src, dst, cap, faces, eyes];
    return interval(_interval)
      .pipe(
        mergeMap(_ => observableFrom(this.detectFace(this._model, src, dst, gray, cap, faces)))
      );
  }

  ngOnDestroy(): void {
    this._destroy$.next(true);
  }
}

@Injectable({
  providedIn: 'root'
})
export class OpenCvPointsDrawerService {

  public drawFacePoints = (context?: CanvasRenderingContext2D) => (facePoints: { x: number, y: number, width: number, height: number }[]) => {
    if (facePoints && context) {
      requestAnimationFrame(
        () => {
          drawRectStroke(facePoints)(context);
        }
      );
    }
  }
}
