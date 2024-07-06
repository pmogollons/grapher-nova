# Reducers

The reducers are a sort of "smart fields" which allow you to compose different results
from your query.

To achieve this we use inside `Mongo.Collection` the `addReducers()` method:
```js
Collection.addReducer({
    reducerName: {
        dependency: graphDependencyBody,
        async reduce(object) {
            return value; // can be anything, object, date, string, number, etc
        },
    }
})
```

## Basics

```js
Meteor.users.addReducers({
    fullName: {
        dependency: {
            profile: {
                firstName: 1,
                lastName: 1
            }
        },
        async reduce(object) {
            const {profile} = object;
            
            return `${profile.firstName} ${profileLastName}`;
        }
    }
})
```

Query:
```js
const user = await Meteor.users.createQuery({
    fullName: 1,
}).fetchOneAsync();
```

Results to:
```
{
    _id: 'XXX',
    fullName: 'John Smith',
}
```

## Reducers that use links

Easily grab the data from your links (as deep as you want them), if you want to reduce it.

```js
Meteor.users.addReducers({
    groupNames: {
        dependency: {
            // assuming you have a link called groups
            groups: { name: 1 } 
        },
        async reduce(object) {
            return object.groups.map(group => group.name).join(',')
        }
    }
})
```

Query:
```js
const user = await Meteor.users.createQuery({
    groupNames: 1,
}).fetchOneAsync();
```

Result:
```
{
    _id: 'XXX',
    groupNames: ['Group 1', 'Group 2'],
}
```

Note that `groups: []` is not present in your result set. This is because we detect the fact that you
did not include it in the body of your query, however if you would have done:

Query:
```js
const user = await Meteor.users.createQuery({
    groupNames: 1,
    groups: {
        createdAt: 1,
    }
}).fetchOneAsync();
```

Result:
```
{
    _id: 'XXX',
    groupNames: ['Group 1', 'Group 2'],
    groups: [
        {_id: 'groupId1', createdAt: Date},
        {_id: 'groupId2', createdAt: Date},
    ]
}
```

Notice that group `name` is not there. This is because we clean leftovers so the result is predictable.

## Reducers can be composed

You can also use other reducers inside your reducers.

```
// setting up
Users.addReducers({
    fullName: {...}
    fullNameWithRoles: {
        dependency: {
            fullName: 1,
            roles: 1
        },
        async reduce(object) {
            return object.fullName + ' ' + object.roles.join(',');
        }
    }
})
```

And again, unless you specified `fullName: 1` in your query, it will not be present in the result set.

## Params-aware reducers

By default the reducer receives the parameters the query has.

This can open the path to some nice customizations:
```js
Collection.addReducers({
    reducer: {
        dependency,
        async reduce(user, params) {}
    }
})
```

Be aware that this reducer may be used from any queries with different types of parameters.

## Reducers can be impure

If we want to just receive the number of posts a user posted, we can use reducers for this:

```
Meteor.users.addReducers({
    postCount: {
        dependency: {_id: 1},
        async reduce(user) {
            const igImages = await fetch(URL, { userId });
            
            return igImages;
        }
    }
})
```

## Conclusion

Reducers are a neat way to remove boilerplate from your code, especially for our infamous `emails[0].address`,
inside `Meteor.users` collection, check if you can figure out how to reduce it!

## [Continue Reading](named_queries.md) or [Back to Table of Contents](index.md)
