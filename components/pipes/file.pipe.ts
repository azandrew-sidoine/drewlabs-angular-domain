import { Pipe, PipeTransform } from "@angular/core";

@Pipe({name: 'blobImage'})
export class BlobImage implements PipeTransform {
    constructor() {
    }
    transform(value: string) {
        return "data:application/octet-stream;base64," + value;
    }
}