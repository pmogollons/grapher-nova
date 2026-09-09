import { Mongo } from "meteor/mongo";
import { createQuery, type IQuery, type ProjectedResult } from "meteor/pmogollons:nova";
import type { IQuery as EntryQuery, ProjectedResult as EntryResult } from "../../@types/src/index";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Result<Q> = Q extends IQuery<any, infer R> ? R : never;

interface Profile {
  firstName: string;
  lastName: string;
  readonly nickname?: string | null;
  _id: number;
}
interface User {
  readonly _id?: string;
  readonly username: string;
  email: string;
  profile?: Profile | null;
  contacts: (Profile | null)[] | null;
  readonlyContacts?: readonly Profile[];
  tags: string[];
}
interface UserResult extends User {
  displayName: string;
  friends?: User[] | null;
  postCount: number;
}
const users = new Mongo.Collection<User, UserResult>("users");

const unnamed = users.createQuery({ username: true, displayName: 1 }, { params: { active: true } });
const named = users.createQuery("users", { username: true, displayName: 1 }, { params: {} });
interface SavedBody { username: true }
declare const savedBody: SavedBody;
const saved = users.createQuery(savedBody);
type SavedResult = Assert<Equal<Result<typeof saved>, { readonly username: string; readonly _id: string }>>;
type NamedMatches = Assert<Equal<Result<typeof named>, Result<typeof unnamed>>>;
type Selected = Assert<Equal<Result<typeof named>["username"], string>>;
type Transformed = Assert<Equal<Result<typeof named>["displayName"], string>>;
type AutomaticId = Assert<Equal<Result<typeof named>["_id"], string>>;
type CloneResult = Assert<Equal<typeof named, ReturnType<typeof named.clone>>>;
type FetchResult = Assert<Equal<ReturnType<typeof named.fetchAsync>, Promise<Result<typeof named>[]>>>;
type FetchOneResult = Assert<Equal<ReturnType<typeof named.fetchOneAsync>, Promise<Result<typeof named>>>>;

async function selectedAccess() {
  const user = await named.clone({ active: false }).fetchOneAsync({ userId: "viewer" });
  const name: string = user.username;
  // @ts-expect-error Email was not selected.
  user.email;
  // @ts-expect-error Preserve document readonly modifiers.
  user.username = "changed";
  // @ts-expect-error Automatic identifiers retain document readonly modifiers.
  user._id = "changed";
  const list = await unnamed.fetchAsync();
  // @ts-expect-error Clone and list fetches must not widen the result.
  list[0].profile;
}

const nested = users.createQuery({
  profile: { firstName: true, nickname: true },
  contacts: { firstName: 1 },
  readonlyContacts: { firstName: -1 },
  tags: true,
});
type Nested = Result<typeof nested>;
type OptionalProfile = Assert<Equal<Nested["profile"], { firstName: string; readonly nickname?: string | null } | null | undefined>>;
type NullableArray = Assert<Equal<Nested["contacts"], ({ firstName: string } | null)[] | null>>;
type ReadonlyArray = Assert<Equal<Nested["readonlyContacts"], readonly { firstName: string }[] | undefined>>;
type PrimitiveArray = Assert<Equal<Nested["tags"], string[]>>;
const optionalResult: Pick<Nested, "profile" | "readonlyContacts"> = {};
declare const nestedResult: Nested;
// @ts-expect-error Optional and nullable profiles must be narrowed.
nestedResult.profile.firstName;
// @ts-expect-error Nested fields not selected must be absent.
nestedResult.profile?.lastName;
// @ts-expect-error Embedded identifiers are not automatically selected.
nestedResult.profile?._id;
// @ts-expect-error Preserve readonly array mutability.
nestedResult.readonlyContacts?.push({ firstName: "name" });

const full = users.createQuery({ profile: {}, contacts: -1, readonlyContacts: 1 });
type WholeEmpty = Assert<Equal<Result<typeof full>["profile"], User["profile"]>>;
type WholeNegativeOne = Assert<Equal<Result<typeof full>["contacts"], User["contacts"]>>;
type WholeOne = Assert<Equal<Result<typeof full>["readonlyContacts"], User["readonlyContacts"]>>;
const nestedId = users.createQuery({ profile: { _id: true } });
type ExplicitNestedId = Assert<Equal<NonNullable<Result<typeof nestedId>["profile"]>["_id"], number>>;
const empty = users.createQuery({});
type Empty = Assert<Equal<Result<typeof empty>, { readonly _id: string }>>;
const withoutId = new Mongo.Collection<{ value: number }>("withoutId").createQuery({ value: true });
type UnknownId = Assert<Equal<Result<typeof withoutId>["_id"], unknown>>;

const links = users.createQuery({
  friends: {
    username: true,
    $options: { readPreference: "secondaryPreferred" },
    undeclaredReducer: true,
  },
  postCount: true,
  externalLink: { title: true, $filters: { active: true } },
});
type Count = Assert<Equal<Result<typeof links>["postCount"], number>>;
type FriendName = Assert<Equal<NonNullable<Result<typeof links>["friends"]>[number]["username"], string>>;
type UnknownReducer = Assert<Equal<NonNullable<Result<typeof links>["friends"]>[number]["undeclaredReducer"], unknown>>;
type UnknownLink = Assert<Equal<Result<typeof links>["externalLink"], unknown>>;
declare const linkResult: Result<typeof links>;
// @ts-expect-error Unselected link fields must be absent.
linkResult.friends?.[0].email;
// @ts-expect-error Undeclared link results require narrowing.
linkResult.externalLink.title;
// @ts-expect-error Query controls are not result fields.
linkResult.friends?.[0].$options;
users.createQuery({ externalReducer: true });
users.addReducers({
  count: {
    dependency: { friends: { username: true, dynamicReducer: true }, dynamicLink: { title: true } },
    async reduce(user) { return user.displayName.length; },
  },
});

const controlled = users.createQuery({
  username: true,
  $filters: { email: "a@example.com" },
  $options: { readPreference: "secondaryPreferred", limit: 10 },
  $search: { index: "users", path: ["username"], sort: { username: 1, score: -1 } },
  $paginate: true,
  $filtering: true,
  $filter({ options }) { options.readPreference = "secondaryPreferred"; },
  $: { options: { readPreference: "secondaryPreferred" } },
});
type ControlsExcluded = Assert<Equal<keyof Result<typeof controlled>, "_id" | "username">>;
users.createQuery({ username: true, $: () => ({ options: { readPreference: "secondaryPreferred" } }) });
// @ts-expect-error Invalid read preference must remain rejected.
users.createQuery({ username: true, $options: { readPreference: "invalid" } });
// @ts-expect-error Invalid sort direction must remain rejected.
users.createQuery("badSort", { username: true, $search: { index: "users", sort: { score: 2 } } });
// @ts-expect-error Nested link options must remain checked.
users.createQuery({ friends: { username: true, $options: { readPreference: "invalid" } } });
// @ts-expect-error Existing declared scalar projection values are unchanged.
users.createQuery({ username: "invalid" });

function useFetch<T, R>(query: IQuery<T, R>): Promise<R[]> { return query.fetchAsync(); }
const hookResult = useFetch(named);
type Hook = Assert<Equal<typeof hookResult, Promise<Result<typeof named>[]>>>;
declare const legacy: IQuery<User>;
type LegacyFetch = Assert<Equal<ReturnType<typeof legacy.fetchAsync>, Promise<User[]>>>;
type LegacyClone = Assert<Equal<ReturnType<typeof legacy.clone>, IQuery<User>>>;
type DefaultQuery = Assert<Equal<ReturnType<IQuery["fetchOneAsync"]>, Promise<any>>>;
type EntryImport = Assert<Equal<EntryQuery<User>, IQuery<User>>>;
type ProjectionImport = Assert<Equal<EntryResult<User, { username: true }>, ProjectedResult<User, { username: true }>>>;
type Manual = ProjectedResult<User, { username: true; profile: { firstName: true } }>;
type ManualProfile = Assert<Equal<Manual["profile"], { firstName: string } | null | undefined>>;

const resolver = createQuery("stats", async () => ({ count: 1 }));
const collectionResolver = users.createQuery("stats", async (params) => ({ count: params.count }), { params: {} });
type ResolverFetch = Assert<Equal<ReturnType<typeof resolver.fetchAsync>, Promise<any>>>;
type CollectionResolverFetch = Assert<Equal<ReturnType<typeof collectionResolver.fetchAsync>, Promise<any>>>;
type ResolverClone = Assert<Equal<ReturnType<ReturnType<typeof resolver.clone>["fetchAsync"]>, Promise<any>>>;
type CollectionResolverClone = Assert<Equal<ReturnType<ReturnType<typeof collectionResolver.clone>["fetchAsync"]>, Promise<any>>>;

const untyped = new Mongo.Collection("dynamic").createQuery({
  title: true,
  $options: { readPreference: "secondaryPreferred" },
  $filter({ options }) { options.limit = 1; },
});
type UntypedSelected = Assert<Equal<Result<typeof untyped>["title"], any>>;
type UntypedKeys = Assert<Equal<keyof Result<typeof untyped>, "_id" | "title">>;
// @ts-expect-error Known options remain checked on untyped collections.
new Mongo.Collection("dynamic").createQuery({ $options: { readPreference: "invalid" } });

type UnionProjection = ProjectedResult<
  { _id: string; value: { firstName: string; hidden: number } | { firstName: number; other: boolean } },
  { value: { firstName: true } }
>;
type UnionBranches = Assert<Equal<UnionProjection["value"], { firstName: string } | { firstName: number }>>;
type TupleProjection = ProjectedResult<
  { _id: number; values: readonly [Profile, Profile | null] },
  { values: { firstName: true } }
>;
type TupleElements = Assert<Equal<TupleProjection["values"], readonly [{ firstName: string }, { firstName: string } | null]>>;
type DollarFields = ProjectedResult<{ _id: number; username: string; $metadata: string }, {
  username: true; $metadata: true; $search: { index: "users" };
}>;
type NoDollarFields = Assert<Equal<keyof DollarFields, "_id" | "username">>;
