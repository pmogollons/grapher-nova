# Grapher 2.0 [(Using bluelibs nova)](https://www.bluelibs.com/docs/package-nova)

_Grapher_ is a Data Fetching Layer on top of Meteor and MongoDB. It is production ready and battle tested.

How to install:
```bash
mkdir packages
cd packages
git clone https://github.com/pmogollons/grapher.git
```

Companion packages
* [grapher-react](https://github.com/pmogollons/grapher-react.git)
* [grapher-react-native](https://github.com/pmogollons/grapher-react-native)

### Differences with the original Grapher:
* No pub/sub (no reactivity), only methods
* No meta links and meta filters
* No linker engine (removed getLink, set, unset, add, remove, metadata)
* No $postFilters or $postOptions
* All reducers reduce function should be async
* Removed fetch, fetchSync, fetchOne and fetchOneSync, now use fetchAsync and fetchOneAsync
* No denormalization
* No global or collection expose
* No graphQL bridge
* No support for $filters, $filter and $options in reducers and links body, use ```$: {}``` instead
* foreignIdentityField is now foreignField

### Changes and new features:
* Firewalls and reducers are async
* Filtered links (new)
* Link aliasing (new)
* New $ key for filters and options (new)
* Support to hook into the mongodb pipeline for advanced queries (new)
* Dynamic filters (new)
* Reducers have extendable context with userId (new)
* Support for transactions (new)
* Support for high performance queries when setting collection schema (new)

## [Documentation](docs/index.md)

This provides a learning curve for Grapher, and it explains all the features. If you want to visualize the documentation better, check it out here:

## [API](docs/api.md)

Grapher cheatsheet, after you've learned it's powers this is the document will be very useful.

### Quick Illustration

Query:

```js
await createQuery({
    posts: {
        title: 1,
        author: {
            fullName: 1,
        },
        comments: {
            text: 1,
            createdAt: 1,
            author: {
                fullName: 1,
            },
        },
        categories: {
            name: 1,
        },
    },
}).fetchAsync();
```

Result:

```
[
    {
        _id: 'postId',
        title: 'Introducing Grapher',
        author: {
            _id: 'authorId',
            fullName: 'John Smith
        },
        comments: [
            {
                _id: 'commentId',
                text: 'Nice article!,
                createdAt: Date,
                author: {
                    fullName: 1
                }
            }
        ],
        categories: [ {_id: 'categoryId', name: 'JavaScript'} ]
    }
]
```
