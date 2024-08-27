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

interface IQuery {
  name: string;
  setParams(params?: AnyObject): void;
  resolve(resolver: (params: AnyObject) => any): Promise<any> | any;
  expose(params: ExposeParams): void;
  clone(params?: AnyObject): IQuery;
  fetchAsync(context?: ContextType): Promise<any[] | any>;
  fetchOneAsync(context?: ContextType): Promise<AnyObject>;
  invalidateQueries(params?: AnyObject): void;
  invalidateAllQueries(): void;
}

type DependencyGraph = {
  [field: string]: DependencyGraph
}

type FilterFunction = (params: FilterParams) => void;

type QueryOptions<T = any> = {
  $filter?: FilterFunction;
  $filters?: DependencyGraph;
}

type FilterParams = {
  filters: AnyObject;
  options: AnyObject;
  params: AnyObject;
}

type BodyT<T> = {
  [field: string]: DependencyGraph | BodyT<T> | QueryOptions<T>;
}

declare module "meteor/pmogollons:nova" {
  type createQuery = (name: string, func: () => void) => IQuery;
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
          index?: boolean;
          filters?: any;
        } }): void;
      addReducers(reducers: {
        [key: string]: {
          dependency: any,
          pipeline?: any[];
          projection?: any;
          reduce: any;
        }}): void;
      createQuery(body: BodyT<T>, options?: AnyObject): IQuery;
      createQuery(name: string, body: BodyT<T>, options?: AnyObject): IQuery;
      aggregate(pipeline: any[], options: AnyObject): Promise<any[]>;
    }
  }
}