# API

Use this as a cheatsheet after you have read the full documentation.

*   [Adding Links](#adding-links)
*   [Adding Reducers](#adding-reducers)
*   [Creating Named Queries](#creating-named-queries)
*   [Exposing Named Queries](#exposing-named-queries)
*   [Using Queries](#using-queries)
*   [Caching Named Queries](#caching-named-queries)
*   [Creating Global Queries](#creating-global-queries)

### Adding Links

```js
Collection.addLinks({
    linkName: {
        collection, // Mongo.Collection
        type, // 'one' or 'many'
        field, // String
        index, // Boolean, whether to index your collections
    },
});

Collection.addLinks({
    linkName: {
        collection, // Mongo.Collection
        inversedBy, // The link name from the other side
    },
});
```

### Adding Reducers

```js
Collection.addReducers({
    reducerName: {
        dependency, // Object, dependency graph
        async reduce(object) {
            // return the value
        },
    },
});
```

### Creating Named Queries

```js
Collection.createQuery(
    'queryName',
    {
        $: {
          filters: {},
          options: {},
        },
        // Old way is still compatible but not recommended
        $options, // Mongo Options {sort, limit, skip}
        $filters, // Mongo Filters
        $filter({ filters, options, params }) {}, // Function or [Function]
        body, // The query body
    },
    {
        params, // Default parameters
        validateParams, // Object or Function
    }
);
```

### Exposing Named Queries

```js
query.expose({
    firewall(userId, params) {}, // Function or [Function]
    method, // Boolean
    unblock, // Boolean
    validateParams, // Function or Object
    embody, // Object which extends the body server-side securely, or Function(body, params)
});
```

### Creating and Exposing Resolvers

```js
// both
const query = createQuery('queryName', () => {});

// server
query.expose({
    firewall, // Function or [Function]
});

query.resolve(function(params) {
    // this.userId
    return [];
});
```

### Using Queries

```js
query.setParams({}); // extends current params
```

```js
query.clone({ params }).fetchAsync();
query.clone({ params }).fetchOneAsync();
query.clone({ params }).getCountAsync();
```

#### Caching Named Queries

```js
import { MemoryResultCacher } from 'meteor/pmogollons:nova';

// server-side
query.cacheResults(
    new MemoryResultCacher({
        ttl: 60 * 1000, // 60 seconds
    })
);
```

#### Creating Global Queries

```js
Collection.createQuery({
    $: {
        filters: {},
        options: {},
    },
    $options, // Compatible, but not recommended. Mongo Options {sort, limit, skip}
    $filters, // Compatible, but not recommended. Mongo Filters
    $filter({ filters, options, params }) {}, // Compatible, but not recommended. Function or [Function]
    body, // the rest of the object
});
```
---

Read about the tool that makes Grapher so performant.

## [Bluelibs Nova](https://www.bluelibs.com/docs/package-nova)
