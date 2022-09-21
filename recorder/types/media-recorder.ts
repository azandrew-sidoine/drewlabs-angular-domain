
/**
 * Type definitions during development
 */
interface MediaRecorderOptions {
  audioBitsPerSecond?: number;
  bitsPerSecond?: number;
  mimeType?: string;
  videoBitsPerSecond?: number;
}

interface Disposable {
  /**
   * Cleanup object handles
   */
  dispose(): void | Promise<void>;
}

export type MediaRecorderConfig = MediaRecorderOptions;

export interface MediaRecorder extends Disposable {
  /**
   * @description Start recording from a given timeslice
   * @param timeslice
   */
  start(timeslice?: number | undefined): void;

  /**
   * @description Stop recording on the media stream
   */
  stop(): void;

  /**
   * @description Get the current recorded track
   */
  toBlob(): BlobPart | Blob;

  /**
   * @description Pauses the recording task
   */
  pause(): void;

  /**
   * @description Resumes the recording task
   */
  resume(): void;
}
