import { Inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { CacheProvider, FormsClient } from "../../core";
import { FormInterface } from "../../core/compact";
import { CACHE_PROVIDER } from "./cache-provider";

@Injectable()
export class JSONFormsClient implements FormsClient {
  // Creates an instance of the FormClient class
  constructor(
    @Inject(CACHE_PROVIDER)
    private provider: CacheProvider
  ) {}

  // Get a form configuration using id
  get(id: string | number): Observable<FormInterface|undefined> {
    return this.provider.get(id);
  }

  // Get List of form configurations
  getAll(list: any[]): Observable<FormInterface[]> {
    return this.provider.getList(list);
  }
}
