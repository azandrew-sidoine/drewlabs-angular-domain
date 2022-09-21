import { Injectable, OnDestroy } from '@angular/core';
import { Base64 } from '../utils/io';
import {
  MediaRecorder as MediaRecorderInterface,
  MediaRecorderConfig,
} from './types';

type RecorderState = {
  recording: boolean | undefined;
  paused: boolean | undefined;
  buffer: BlobPart[] | undefined;
  stopped: boolean | undefined;
};

const initState: RecorderState = {
  paused: undefined,
  buffer: [],
  stopped: undefined,
  recording: undefined,
};

@Injectable()
export class Recorder implements MediaRecorderInterface, OnDestroy {
  // Initial recorder state
  private _state!: RecorderState;

  // // Recorded content stream
  // private readonly _stream$ = createSubject<Blob>();
  // public stream$ = this._stream$.asObservable();

  // Instance initializer
  private constructor(private recorder?: MediaRecorder) {
    // Initialize the recorder object
    this.setState(initState);
    this.recorder?.addEventListener('dataavailable', this.onData.bind(this));
    this.recorder?.addEventListener('pause', this.onPause.bind(this));
    this.recorder?.addEventListener('resume', this.onResume.bind(this));
    this.recorder?.addEventListener('stop', this.onStop.bind(this));
  }

  static createFromStream(
    stream: MediaStream,
    options: MediaRecorderConfig = { mimeType: 'video/mp4' }
  ) {
    if (
      !MediaRecorder.isTypeSupported('video/mp4') &&
      options?.mimeType === 'video/mp4'
    ) {
      options = { ...(options || {}), mimeType: 'video/webm' };
    }
    options = { ...(options || {}), videoBitsPerSecond: 400000 };
    const recorder = new MediaRecorder(stream, options || {});
    return new Recorder(recorder);
  }

  static createFromTracks(tracks: MediaStreamTrack[]) {
    return Recorder.createFromStream(new MediaStream(tracks));
  }

  private onData(ev: BlobEvent) {
    console.log('Data event fired: ', ev);
    const buffer = [...(this._state.buffer || []), ev.data];
    this.setState({ buffer });
  }

  private onPause(e: Event) {
    this.setState({ paused: true });
    e.preventDefault();
  }

  private onResume(e: Event) {
    this.setState({ paused: false });
    e.preventDefault();
  }

  private onStop(e: Event) {
    e.preventDefault();
  }

  public start(timeslice?: number | undefined) {
    this.setState({ recording: true });
    this.recorder?.start(timeslice);
  }

  public stop() {
    if (this.recorder && this.isRunning()) {
      this.recorder.stop();
    }
  }

  public pause() {
    if (!this.recorder) {
      throw new Error('Recorder is not available...');
    }
    this.recorder?.pause();
  }

  public resume() {
    if (this.recorder && this.isPaused()) {
      this.recorder?.resume();
    }
    throw new Error(
      this.recorder
        ? 'Cannot resume a running recording'
        : 'Recorder is not available...'
    );
  }

  public toBlob() {
    if (this.recorder && this._state.buffer) {
      return new Blob(this._state.buffer, {
        type: this.recorder?.mimeType,
      });
    }
    throw new Error(
      this.recorder
        ? 'Error while recording, no data available'
        : 'Recorder is not available...'
    );
  }

  public async toDataURL() {
    const blob = this.toBlob() as Blob;
    return (await Base64.fromBlob(blob)).toString();
  }

  public isPaused() {
    return this._state.paused;
  }

  private setState(state: Partial<RecorderState>) {
    this._state = { ...this._state, ...state };
  }

  public reset() {
    this.setState(initState);
  }

  dispose() {
    if (this.recorder) {
      this.recorder.removeEventListener(
        'dataavailable',
        this.onData.bind(this)
      );
      this.recorder.removeEventListener('pause', this.onPause.bind(this));
      this.recorder.removeEventListener('resume', this.onResume.bind(this));
      this.recorder.removeEventListener('stop', this.onStop.bind(this));
      this.recorder = undefined;
      this.reset();
    }
  }

  ngOnDestroy() {
    if (this.recorder) {
      this.dispose();
    }
  }

  /**
   * @description Check if the recorder is in running state or not. Being in
   * running state means the recorder is `recording` or is paused
   */
  private isRunning() {
    return (
      this.recorder &&
      (this.recorder.state === 'recording' || this.recorder.state === 'paused')
    );
  }
}
