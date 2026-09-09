/* eslint no-unused-vars: 0 */
import type * as m from "meteor/mongo";

type AnyObject = Record<string, any>;
type FirewallFunc = (userId: string, params: AnyObject) => Promise<void> | void;
type EmbodyFunc = (body: AnyObject, params: AnyObject) => AnyObject;

type RateLimit = {
  limit?: number;
  time?: number;
  message?: string;
}

type ExposeParams = {
  firewall?: FirewallFunc | FirewallFunc[];
  method?: boolean;
  unblock?: boolean;
  schema?: any; // TODO: Improve
  rateLimit?: RateLimit;
  validateParams?: any; // Function or Object
  embody?: AnyObject | EmbodyFunc;
  cache?: {
    ttl?: number;
    type?: "list" | "single";
  };
}

type ContextType = {
  userId?: string;
  session?: any; // Transaction mongo session
  [key: string]: any;
}

export interface IQuery<T = any, R = T> {
  name: string;
  setParams(params?: AnyObject): void;
  resolve(resolver: (params: AnyObject) => any): Promise<any> | any;
  expose(params: ExposeParams): void;
  clone(params?: AnyObject): IQuery<T, R>;
  fetchAsync(context?: ContextType): Promise<R[]>;
  // Kept non-optional for compatibility; an empty query returns undefined at runtime.
  fetchOneAsync(context?: ContextType): Promise<R>;
  invalidateQueries(params?: AnyObject): void;
  invalidateAllQueries(): void;
}

interface IResolverQuery<T = any> extends IQuery<T, any> {
  clone(params?: AnyObject): IResolverQuery<T>;
  fetchAsync(context?: ContextType): Promise<any>;
}

type $<T = any> = {
  filters?: m.Mongo.Selector<T>;
  options?: m.Mongo.Options<T> & { readPreference?: "secondaryPreferred" };
  pipeline?: any[]; // TODO: Improve
  [field: string]: $ | AnyObject | undefined;
} | ((object: T) => {
  filters?: m.Mongo.Selector<T>;
  options?: m.Mongo.Options<T> & { readPreference?: "secondaryPreferred" };
  pipeline?: any[]; // TODO: Improve
});

type FilterFunction = (params: FilterParams) => void;
type SearchIndex = {
  path?: string[];
  index: string;
  isCompound?: boolean;
  /** Sort by indexed fields or use searchScore to sort by relevance. */
  sort?: Record<string, 1 | -1>;
}
type TextIndex = {
  index: "$text";
  language?: string;
  caseSensitive?: boolean;
  diacriticSensitive?: boolean;
}
type RegExIndex = {
  index: "$regex";
  path: string | string[];
}

type FilterParams<T = any> = {
  filters: m.Mongo.Selector<T>;
  options: m.Mongo.Options<T> & { readPreference?: "secondaryPreferred" };
  params: AnyObject;
}

type QueryOptions<T = any> = {
  $?: $<T>;
  $filter?: FilterFunction;
  $filters?: m.Mongo.Selector<T>;
  $options?: m.Mongo.Options<T> & { readPreference?: "secondaryPreferred" };
  $search?: SearchIndex | TextIndex | RegExIndex;
  $paginate?: boolean;
  $filtering?: boolean;
}

type ProjectionValue = 1 | -1 | true;
// Links may expose fields and reducers outside the persisted document shape,
// while their Nova query options should remain type-checked.
type AnyLinkProjection = QueryOptions<any> & Record<string, unknown>;

// `any` permits reusable interface-typed bodies without an index signature.
// It does not affect result inference: undeclared selected keys become unknown.
type Projection<T> = 0 extends (1 & T)
  ? AnyObject
  : {
      [K in keyof T as K extends `$${string}` ? never : K]?: ProjectionValue | AnyLinkProjection;
    } & AnyObject;

type BodyT<T> = QueryOptions<T> & Projection<T>;

type SelectedKeys<B> = Exclude<keyof B, `$${string}`>;
type Simplify<T> = { [K in keyof T]: T[K] };
type RequiredIdentifier<T> = { [K in keyof T]-?: Exclude<T[K], undefined> };
type RootIdentifier<T> = "_id" extends keyof T
  ? RequiredIdentifier<Pick<T, "_id">>
  : { _id: unknown };

// Mapping over Pick preserves the document's optional and readonly modifiers,
// rather than inheriting modifiers from the query body.
type ProjectKnownFields<T, B> = {
  [K in keyof T]: K extends keyof B ? ProjectField<T[K], B[K]> : never;
};

type ProjectFields<T, B> = T extends unknown
  ? Simplify<ProjectKnownFields<Pick<T, Extract<SelectedKeys<B>, keyof T>>, B> & {
      [K in Exclude<SelectedKeys<B>, keyof T>]: unknown;
    }>
  : never;

type ProjectField<T, B> = 0 extends (1 & T) ? any
  : B extends ProjectionValue ? T
  : B extends object
    ? keyof B extends never ? T
      : T extends readonly unknown[]
        ? { [I in keyof T]: ProjectField<T[I], B> }
        : T extends object ? ProjectFields<T, B> : T
    : T;

/**
 * Static query result, including Nova's automatic root identifier.
 * Declare link/reducer fields on the collection's result type for precise types;
 * selected undeclared fields are unknown. Nested identifiers must be selected
 * explicitly, since embedded objects and collection links share a body shape.
 * Runtime body changes and aggregation pipelines cannot be inferred here.
 */
export type ProjectedResult<T, B> = T extends unknown
  ? Simplify<Omit<ProjectFields<T, B>, "_id"> & RootIdentifier<T>>
  : never;

export declare function createQuery(name: string, func: () => void): IResolverQuery;

declare module "meteor/mongo" {
  namespace Mongo {
    interface Collection<T = any, U = T> {
      addLinks(links: {
        [key: string]: {
          collection: any;
          field?: keyof T;
          foreignField?: string;
          unique?: boolean;
          many?: boolean;
          inversedBy?: string;
          index?: 1 | -1 | true;
          filters?: m.Mongo.Selector<T>;
        }
      }): void;
      addReducers(reducers: {
        [key: string]: {
          dependency: Projection<U>,
          pipeline?: any[]; // TODO: Improve
          projection?: any;
          reduce: (object: U, params: AnyObject) => Promise<any>;
        }
      }): void;
      createQuery(name: string, resolver: (params: AnyObject) => any, options?: AnyObject): IResolverQuery<U>;
      createQuery<const B extends BodyT<U>>(body: B, options?: AnyObject): IQuery<U, ProjectedResult<U, B>>;
      createQuery<const B extends BodyT<U>>(name: string, body: B, options?: AnyObject): IQuery<U, ProjectedResult<U, B>>;
      aggregate(pipeline: any[], options: AnyObject): Promise<any[]>; // TODO: Improve pipeline and return type
    }
  }
}
