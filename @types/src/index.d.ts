/* eslint no-unused-vars: 0 */
import type * as m from 'meteor/mongo';

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

interface IQuery<T = any> {
  name: string;
  setParams(params?: AnyObject): void;
  resolve(resolver: (params: AnyObject) => any): Promise<any> | any;
  expose(params: ExposeParams): void;
  clone(params?: AnyObject): IQuery<T>;
  fetchAsync(context?: ContextType): Promise<T[]>;
  fetchOneAsync(context?: ContextType): Promise<T>;
  invalidateQueries(params?: AnyObject): void;
  invalidateAllQueries(): void;
}

interface IResolverQuery<T = any> extends IQuery<T> {
  fetchAsync(context?: ContextType): Promise<any>;
}

type $<T = any> = {
  filters?: m.Mongo.Selector<T>;
  options?: m.Mongo.Options<T>;
  pipeline?: any[]; // TODO: Improve
  [field: string]: $ | AnyObject | undefined;
} | ((object: T) => {
  filters?: m.Mongo.Selector<T>;
  options?: m.Mongo.Options<T>;
  pipeline?: any[]; // TODO: Improve
});

type FilterFunction = (params: FilterParams) => void;
type SearchIndex = {
  path?: string[];
  index: string;
  isCompound?: boolean;
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
  options: m.Mongo.Options<T>;
  params: AnyObject;
}

type QueryOptions<T = any> = {
  $?: $<T>;
  $filter?: FilterFunction;
  $filters?: m.Mongo.Selector<T>;
  $options?: m.Mongo.Options<T>;
  $search?: SearchIndex | TextIndex | RegExIndex;
  $paginate?: boolean;
  $filtering?: boolean;
}

type ProjectionValue = 1 | -1 | true;

type Projection<T> = {
  [K in keyof T as K extends `$${string}` ? never : K]?: ProjectionValue | Projection<any>;
};

type BodyT<T> = QueryOptions<T> & Projection<T>;

declare module "meteor/pmogollons:nova" {
  export function createQuery(name: string, func: () => void): IResolverQuery;
}

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
      createQuery(body: BodyT<U>, options?: AnyObject): IQuery<U>;
      createQuery(name: string, body: BodyT<U>, options?: AnyObject): IQuery<U>;
      aggregate(pipeline: any[], options: AnyObject): Promise<any[]>; // TODO: Improve pipeline and return type
    }
  }
}