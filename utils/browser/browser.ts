import { isPlatformBrowser } from '@angular/common';
import { isDefined } from '../types/type-utils';
import { saveAs } from 'file-saver';

type WindowEvent = (self: Window, ev?: Event) => any;

/**
 * Provides with promise base file reader functionnality
 * @param file [[File|any]]
 */
export function readFileAsDataURI(file: File | Blob) {
  return new Promise<string>((_, __) => {
    if (isDefined(file)) {
      const reader = new FileReader();
      reader.onload = async (e: ProgressEvent) => {
        _((e.target as FileReader).result.toString());
      };
      reader.readAsDataURL(file);
    } else {
      _(null);
    }
  });
}

/**
 * @description Convert a base64 encoded string into a [[Blob]] javascript object
 * @param b64Data [[string]] Base64 encoded string
 * @param contentType [[string]]
 * @param sliceSize [[number]] Size of each BlobPart
 */
export function b64toBlob(b64Data: string, contentType: string, sliceSize?: number) {
  contentType = contentType || '';
  sliceSize = sliceSize || 512;

  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
}
export class Browser {
  public static print() {
    window.print();
  }

  public static printpart (area: string) {
    let printwin = window.open("");
    printwin.document.write(document.getElementById(area).innerHTML);
    printwin.stop();
    printwin.print();
    printwin.close();
  }

  public static definePrintHandlers(
    callBackBeforePrint: WindowEvent,
    callBackAfterPrint: WindowEvent
  ) {
    if (window.matchMedia) {
      const mediaQueryList = window.matchMedia('print');
      // tslint:disable-next-line: deprecation
      mediaQueryList.addListener(mql => {
        if (mql.matches) {
          callBackBeforePrint(window);
        } else {
          callBackAfterPrint(window);
        }
      });
    }

    window.onbeforeprint = callBackBeforePrint(window);
    window.onafterprint = callBackBeforePrint(window);
  }

  public static scrollTo(element: HTMLElement, to: number, duration: number) {
    if (duration < 0) {
      return;
    }
    const difference = to - element.scrollTop;
    const perTick = (difference / duration) * 2;
    setTimeout(() => {
      element.scrollTop = element.scrollTop + perTick;
      this.scrollTo(element, to, duration - 2);
    }, 10);
  }

  static document(platformId: object) {
    return isPlatformBrowser(platformId) ? document : null;
  }

  /**
   * Saves a file by opening file-save-as dialog in the browser
   * using file-save library.
   * @param blobContent file content as a Blob
   * @param fileName name file should be saved as
   */
  static saveFile(blobContent: Blob | string, fileName: string) {
    const blob = new Blob([blobContent], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  }

  /**
   * @description Save file as it is, without converting it to a blob content
   * @param blobContent [[Blob|string]]
   * @param fileName [[string]]
   */
  static saveFileAsRaw(blobContent: Blob | string, fileName: string) {
    saveAs(blobContent, fileName);
  }
}
