// Minimal dependency surface. Nova's declarations are always loaded from source.
export namespace Mongo {
  type Selector<T> = Partial<T> | { $and: Selector<T>[] };
  interface Options<T> {
    limit?: number;
    skip?: number;
    sort?: Partial<Record<keyof T, 1 | -1>>;
  }
  class Collection<T = any, U = T> {
    constructor(name: string, options?: { transform?: (document: T) => U });
  }
}
