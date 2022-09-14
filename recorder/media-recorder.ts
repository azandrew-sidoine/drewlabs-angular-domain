import { Injectable, OnDestroy } from '@angular/core';
import { createSubject } from '../rxjs/helpers';
import { Log } from '../utils';
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

  // Recorded content stream
  private readonly _stream$ = createSubject<Blob>();
  public stream$ = this._stream$.asObservable();

  // Instance initializer
  private constructor(private recorder?: MediaRecorder) {
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
    const buffer = [...(this._state.buffer || []), ev.data];
    this._stream$.next(
      new Blob(buffer || [], { type: this.recorder?.mimeType })
    );
    this.setState({
      buffer,
    });
  }

  private onPause(e: Event) {
    this.setState({
      paused: true,
    });
    e.preventDefault();
  }

  private onResume(e: Event) {
    this.setState({
      paused: false,
    });
    e.preventDefault();
  }

  private onStop(e: Event) {
    this._stream$.next(this.toBlob());
    e.preventDefault();
  }

  public start(timeslice?: number | undefined) {
    this.setState({
      recording: true,
    });
    this.recorder?.start(timeslice);
  }

  public stop() {
    if (
      this.recorder &&
      (this.recorder.state === 'recording' || this.recorder.state === 'paused')
    ) {
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
    if (!this.recorder) {
      throw new Error('Recorder is not available...');
    }
    this.recorder?.resume();
  }

  public toBlob() {
    if (!this.recorder) {
      throw new Error('Recorder is not available...');
    }
    this._state.buffer;
    return new Blob([...(this._state.buffer || [])], {
      type: this.recorder?.mimeType,
    });
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
    // const stream = this.recorder?.stream;
    this.setState(initState);
  }

  dispose() {
    if (this.recorder) {
      this.recorder.removeEventListener('dataavailable', this.onData.bind(this));
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
}
