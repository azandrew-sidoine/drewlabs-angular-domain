import {
  Component,
  EventEmitter,
  Inject,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { combineLatest } from "rxjs";
import { tap } from "rxjs/operators";
import { createSubject } from "../../rxjs/helpers";
import { GEOLOCATION_MANAGER } from "../service/geolocation.service";
import { GeolocationManager } from "../types/geolocation";

@Component({
  selector: "drewlabs-geolocation",
  template: ` <ng-container *ngIf="location$ | async"> </ng-container> `,
})
export class GeolocationComponent implements OnInit, OnDestroy {
  private _destroy$ = createSubject();

  @Output() locationErrorEvent = new EventEmitter<
    GeolocationPositionError | Error | undefined
  >();

  public location$ = combineLatest([
    this.geoService.state$,
    this.geoService.error$.pipe(
      tap((state) => {
        this.locationErrorEvent.emit(state);
      })
    ),
  ]);

  constructor(
    @Inject(GEOLOCATION_MANAGER) private geoService: GeolocationManager
  ) {}

  ngOnDestroy(): void {
    this._destroy$.next();
  }

  ngOnInit(): void {
    this.geoService.getPlatformCurrentPosition();
  }
}
