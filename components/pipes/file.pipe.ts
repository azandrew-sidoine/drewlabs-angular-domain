import { Pipe, PipeTransform } from "@angular/core";

@Pipe({name: 'blobImage'})
export class BlobImage implements PipeTransform {
    constructor() {
    }
    transform(value: string, param: string) {
        if (param == 'pdf') {
            return "data:application/pdf;base64," + value;
        }
        return "data:application/octet-stream;base64," + value;
    }
}