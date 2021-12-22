import { ICollection } from '../contracts/collection-interface';
import { isDefined } from '../utils/types/type-utils';

export class Collection<T> implements ICollection<T>, Iterable<T> {
  protected items: { [index: string]: T } = {};
  private counter = 0;

  /**
   * @description Build a new collection from a predefined collection. Provide a shalow copy of the collection passed as parameter
   * @param c [[ICollection<T>]]
   */
  static from<T>(c: ICollection<T>): ICollection<T>  {
    const col = new Collection<T>();
    c.keys().forEach((k) => {
      col.add(k, c.get(k));
    });
    return col;
  }

  /**
   * @inheritdoc
   */
  add(key: string, value: T): void {
    if (!this.hasOwnProperty(key)) {
      this.counter++;
      this.items[key] = value;
    }
  }
  /**
   * @inheritdoc
   */
  contains(key: string): boolean {
    return this.items.hasOwnProperty(key);
  }
  /**
   * @inheritdoc
   */
  count(): number {
    return this.counter;
  }
  /**
   * @inheritdoc
   */
  get(key: string): T {
    return this.items[key];
  }

  /**
   * @inheritdoc
   */
  set(key: string, value: T): void {
    this.items[key] = value;
  }

  /**
   * @inheritdoc
   */
  keys(): string[] {
    const keySet: string[] = [];
    for (const prop in this.items) {
      if (this.contains(prop)) {
        keySet.push(prop);
      }
    }
    return keySet;
  }
  /**
   * @inheritdoc
   */
  remove(key: string | string[]): ICollection<T> {
    if (key instanceof Array) {
      key.forEach((k) => this.deleteKey(k));
    } else {
      this.deleteKey(key as string);
    }
    return this;
  }

  private deleteKey(key: string): void {
    if (!this.contains(key)) {
      return null;
    }
    const val = this.items[key];
    delete this.items[key];
    this.counter--;
  }

  /**
   * @inheritdoc
   */
  values(): T[] {
    const values: T[] = [];
    for (const prop in this.items) {
      if (this.contains(prop)) {
        values.push(this.items[prop]);
      }
    }
    return values;
  }

  *[Symbol.iterator] () {
    return this.values()[Symbol.iterator]();
  }

  /**
   * @inheritdoc
   */
  clear(): void {
    this.items = {};
    this.counter = 0;
  }
}


/**
 * @description Convert a list of [T] items into a collection of [T] items
 * @param controls [[T]]
 */
export function collect<T>(controls: T[], using: string = null): ICollection<T>  {
  const collection = new Collection<T>();
  controls.forEach((v: T, index: number) => {
    collection.add(isDefined(using) ? v[using] : index.toString(), v);
  });
  return collection;
}
