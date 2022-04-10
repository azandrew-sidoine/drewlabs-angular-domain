import { Observable } from 'rxjs';
import { FormInterface } from '../compact';

export interface FormsClient {
  /**
   * @description Get form definitions using the user provided id
   * @param id
   */
  get(id: string | number): Observable<FormInterface | undefined>;

  /**
   * @description Get form definitions using the list of user provided ids
   * @param id
   */
  getAll(id: string[] | number[]): Observable<FormInterface[]>;
}
