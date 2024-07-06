# Query Options

Let's learn what a query can do, we know it can fetch related links, but it has some
interesting features.

## Nested fields

Most likely you will have documents which organize data inside an object, such as `user` may have a `profile` object
that stores `firstName`, `lastName`, etc

Grapher automatically detects these fields, as long as there is no link named `profile`:

```js
const user = await Meteor.users.createQuery({
    $: {
      filters: {_id: userId},
    },
    profile: {
        firstName: 1,
        lastName: 1,
    }
}).fetchOneAsync();
```

Now `user` will look like:
```
{
    _id: userId,
    profile: {
        firstName: 'John',
        lastName: 'Smith',
    }
}
```

If you want to fetch the full `profile`, use `profile: 1` inside your query body. Alternatively,
you can also use `'profile.firstName': 1` and `'profile.lastName': 1` but it's less elegant.

## Deep filtering

Lets say we have a `Post` with `comments`:

```js
import {Comments, Posts} from '/imports/db';

Comments.addLinks({
    post: {
        type: 'one',
        field: 'postId',
        collection: Posts,
    },
});

Posts.addLinks({
    comments: {
        collection: Comments,
        inversedBy: 'post',
    }
})
```

If any bit of the code written above creates confusion, take another look on [Linking Collections](linking_collections.md).

We already know that we can query with `$: { filters: {}, options: {} }` and have some parameters.
The same logic applies for child collection nodes:

```js
Posts.createQuery({
    title: 1,
    comments: {
        $: {
          filters: {
            isApproved: true,
          },
        },
        text: 1,
    }
})
```

The query above will fetch as `comments` only the ones that have been approved and that are linked with the `post`.

The `$filter` function shares the same `params` across all collection nodes:

```js
export default Posts.createQuery({
    $filter({filters, params}) {
        if (params.lastWeekPosts) {
            filters.createdAt = {$gt: date}
        }    
    },
    $options: {createdAt: -1},
    title: 1,
    comments: {
        $filter({filters, params}) {
            if (params.approvedCommentsOnly) {
                filters.isApproved = true;
            }  
        },
        $options: {createdAt: -1},
        text: 1,
    }
})
```

```js
const postsWithComments = await postListQuery.clone({
    lastWeekPosts: true,
    approvedCommentsOnly: true
}).fetchAsync();
```

### Default $filter()

The $filter is a function that defaults to:
```js
function $filter({filters, options, params}) {
    if (params.filters) {
        Object.assign(filters, params.filters);
    }
    if (params.options) {
        Object.assign(filters, params.options)
    }
}
```

Which basically means you can easily configure your filters and options through params:
```js
const postsQuery = Posts.createQuery({
    title: 1,
});

const posts = await postQuery.clone({
    filters: {isApproved: true},
    options: {
        sort: {createdAt: -1},
    }
}).fetchAsync();
```

If you like to disable this functionality, add your own $filter() function or use a dummy one:
```js
{
    $filter: () => {}
}
```

Note the default $filter() only applies to the top collection node, otherwise we would have headed into a lot of trouble.

### Pagination

There is a special field that extends the pre-fetch filtering process, and it's called `$paginate`, that allows us
to receive `limit` and `skip` params:

```js
const postsQuery = Posts.createQuery({
    $filter({filters, params}) {
        filters.isApproved = params.postsApproved;
    },
    $paginate: true,
    title: 1,
});

const page = 1;
const perPage = 10;

const posts = await postsQuery.clone({
    postsApproved: true,
    limit: perPage,
    skip: (page - 1) * perPage
}).fetchAsync()
```

This was created for your convenience, as pagination is a common used technique and makes your code easier to read.

Note that it doesn't override the $filter() function, it just applies `limit` and `skip` to the options, before `$filter()` runs.
It only works for the top level node, not for the child collection nodes.

## Counters

If you want just to return the number of top level documents a query has:

```js
await query.getCountAsync()
```

This will be very useful for pagination when we reach the client-side domain, or you just need a count.
Note that `getCountAsync()` applies only the processed `filters` but not `options`.

## Mix'em up

`$filter` also allow you to provide an array of functions:

```js
function userContext({filters, params}) {
    if (!params.userId) {
        throw new Meteor.Error('not-allowed');
    }
    
    filters.userId = params.userId;
}

const posts = await Posts.createQuery({
    $filter: [userContext, ({filters, options, params}) => {
        // do something
    }],
}).fetchAsync()
```

The example above is just to illustrate the possibility, in order to ensure that a `userId` param is sent you will use `validateParams`.

```js
Posts.createQuery({
    $filter({filters, options, params}) {
        filters.userId = params.userId;
    },
    title: 1,
}, {
    validateParams: {
        userId: String
    }
})
```

Validating params will also protect you from injections such as:

```js
const query = postLists.clone({
    userId: {$nin: []},
})
```

When we cross to the client-side domain we need to be very wary of these type of injections.

## Conclusion

Query is a very powerful tool, very flexible, it allows us to do very complex things that would have taken us a lot of time to do otherwise. 

## [Continue Reading](reducers.md) or [Back to Table of Contents](index.md)



