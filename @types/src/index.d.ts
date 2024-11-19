/* eslint no-unused-vars: 0 */

type AnyObject = Record<string, any>;
type FirewallFunc = (userId: string, params: AnyObject) => Promise<void> | void;
type EmbodyFunc = (body: AnyObject, params: AnyObject) => AnyObject;

type ExposeParams = {
  firewall?: FirewallFunc | FirewallFunc[];
  method?: boolean;
  unblock?: boolean;
  schema?: any; // TODO: Improve
  validateParams?: any; // Function or Object
  embody?: AnyObject | EmbodyFunc;
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

type DependencyGraph<T = any> = {
  [field: string]: -1 | 1 | true | DependencyGraph<T>;
}

type $<T = any> = {
  filters?: AnyObject;
  options?: AnyObject;
  pipeline?: any[];
  [field: string]: $ | AnyObject | undefined;
} | ((object: T) => {
  filters?: AnyObject;
  options?: AnyObject;
  pipeline?: any[];
});

type FilterFunction = (params: FilterParams) => void;

type QueryOptions<T = any> = {
  $?: $<T>;
  $filter?: FilterFunction;
  $filters?: AnyObject; // TODO: Improve
  $search?: {
    path?: string;
    index: "text" | "$regex" | string;
    language?: string;
    isCompound?: boolean;
    caseSensitive?: boolean;
    diacriticSensitive?: boolean;
  };
  $paginate?: boolean;
  $filtering?: boolean;
}

type FilterParams = {
  filters: AnyObject; // TODO: Improve
  options: AnyObject; // TODO: Improve
  params: AnyObject; // TODO: Improvee
}

// TODO: We need to improve Body to accept only fields that are in the schema
type BodyT<T> = {
  [field: string]: DependencyGraph | QueryOptions<T> | BodyT<T> | undefined;
} | QueryOptions<T> | DependencyGraph;

declare module "meteor/pmogollons:nova" {
  type createQuery = (name: string, func: () => void) => IResolverQuery;
}

declare module "meteor/mongo" {
  namespace Mongo {
    interface Collection<T, U = T> {
      addLinks(links: {
        [key: string] : {
          collection: any;
          field?: string;
          foreignField?: string;
          unique?: boolean;
          many?: boolean;
          inversedBy?: string;
          index?: 1 | -1 | true;
          filters?: any;
        } }): void;
      addReducers(reducers: {
        [key: string]: {
          dependency: DependencyGraph<T>,
          pipeline?: any[];
          projection?: any;
          reduce: (object: U, params: AnyObject) => Promise<any>;
        }}): void;
      createQuery(body: BodyT<T>, options?: AnyObject): IQuery<U>;
      createQuery(name: string, body: BodyT<T>, options?: AnyObject): IQuery<U>;
      aggregate(pipeline: any[], options: AnyObject): Promise<any[]>;
    }
  }
}