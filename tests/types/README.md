# Declaration regression tests

Run `npm run test:types` from the repository root. Both configurations use the
installed TypeScript compiler with `strict`, `exactOptionalPropertyTypes`,
`skipLibCheck: false`, and `noEmit`. Invalid-access assertions use
`@ts-expect-error`; the compiler fails if an assertion stops producing an error.
Meteor's runtime test transpilation does not replace this check.

The same assertions run against two package-loading arrangements:

- Direct resolution of `meteor/pmogollons:nova` to the declaration entrypoint.
- Meteor's generated ambient modules using `import exports = require(...)` and
  `export = exports`, including the Mongo collection augmentation.

Both load the real `@types/src/index.d.ts`. The small Mongo fixture supplies only
the dependency surface needed by these tests; this suite does not claim to check
every version of Meteor's own declarations. No generated application directories
or local fork paths are required. These files are not imported by the runtime
test entrypoint.

## Compatibility boundaries

- `IQuery<T>` still defaults its result to `T`. Projection inference uses the
  collection's second document parameter, `U`, for `Collection<T, U>`.
- `fetchOneAsync()` retains `Promise<R>` for compatibility even though an empty
  query returns `undefined` at runtime.
- `true`, `1`, and `-1` select whole fields; `-1` is not exclusion. An empty
  embedded projection `{}` also selects the whole embedded field. The existing
  declared scalar projection values are unchanged.
- Root `_id` is automatic and required, with `undefined` removed from its declared
  type, or `unknown` when absent from the document type. Nested identifiers must
  be selected explicitly: declarations cannot distinguish embedded documents
  from registered links.
- Put link/reducer fields in `U` to infer their precise results. Selected fields
  missing from `U` are `unknown` and require narrowing. Registering links or
  reducers at runtime does not alter a collection's generic document type.
- Runtime changes to the body through parameters, embodiment, and aggregation
  pipelines are not statically inferred. Preserve literal query bodies when
  precise projection inference is needed.

The repository-wide TypeScript configuration also includes Meteor runtime tests
and requires generated Meteor dependencies. Its existing missing-module and
top-level-await errors are separate from this portable declaration suite.
