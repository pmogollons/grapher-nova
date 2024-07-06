# Linking Collections

Let's learn what type of links we can define between collections, and what is the best way to do them.

First, we begin with an illustration of the power of Grapher.

Let's assume our `posts` collection, contains a field, called `authorId` which represents an actual `_id` from `Meteor.users`,
if you wanted to get the post and the author's name, you had to first fetch the post, and then get the author's name based on his `_id`.

```js
Meteor.methods({
    async getPost({postId}) {
        let post = await Posts.findOneAsync(postId, {
            fields: {
                title: 1,
                createdAt: 1,
                authorId: 1,
            }
        });
        
        if (!post) { throw new Meteor.Error('not-found') }
        const author = await Meteor.users.findOneAsync(post.authorId, {
            fields: {
                firstName: 1,
                lastName: 1
            }
        });
        
        Object.assign(post, {author});
        
        return post;
    }
})
```

With Grapher, your code above is transformed to:

```js
Meteor.methods({
    async getPost({postId}) {
        let post = Posts.createQuery({
            $: {
              filters: {_id: postId},
            },
            title: 1,
            createdAt: 1,
            author: {
                firstName: 1,
                lastName: 1
            }
        });
        
        return await post.fetchOneAsync();
    }
})
```

This is just a simple illustration, imagine the scenario, in which you had comments,
and the comments had authors, and you needed their avatar. Your code can easily
grow very large, and it's going to be hard to make it performant.

## A basic link

To define the link illustrated in the example above, we create a separate `links.js` file that is 
imported separately outside the collection module. We need to define the links in their own module,
after all collections have been defined, because there will be situations where, when you define the links
where you define the collection, 2 collections import each other, leading to some strange behaviors.

```js
// file: /imports/db/posts/links.js
import Posts from '...';

Posts.addLinks({
    'author': {
        type: 'one',
        collection: Meteor.users,
        field: 'authorId',
    }
})
```

You created the link, and now you can use the query illustrated above. 
We decided to choose `author` as a name for our link and `authorId` the field to store it in, but it's up to you to decide this.

## Nested links

Nested links are also supported:  

```js
// file: /imports/db/posts/links.js
import Posts from '...';

Posts.addLinks({
    'authorObject.authorId': {
        type: 'one',
        collection: Meteor.users,
        field: 'authorObject.authorId',
    },
})
```

In this example we're assuming that `authorObject` is a nested document inside `Posts` collection, and we want to link it to `Meteor.users`.  

Nested arrays are also supported, e.g.:

```js
// file: /imports/db/posts/links.js
import Posts from '...';

Posts.addLinks({
    'authorsArray.authorId': {
        type: 'one',
        collection: Meteor.users,
        field: 'authorsArray.authorId',
    },
})
```

## Inversed links

Because we linked `Posts` with `Meteor.users` it means that we can also get all `posts` of an user.
Because in a way `Meteor.users` is also linked with `Posts` but an `inversed` way. We refer to it as an `Inversed Link`.

```js
// file: /imports/db/users/links.js
import Posts from '...';

Meteor.users.addLinks({
    'posts': {
        collection: Posts,
        inversedBy: 'author'
    }
})
```

`author` represents the link name that was defined inside Posts. Defining inversed links allows us to do:

```js
Meteor.users.createQuery({
    posts: {
        title: 1
    }
})
```

## One and Many

Above you've noticed a `type: 'one'` in the link definition, but let's say we have a `Post` that belongs to many `Categories`,
which have their own collection into the database. This means that we need to relate with more than a single element.

```js
// file: /imports/db/posts/links.js
import Posts from '...';
import Categories from '...';

Posts.addLinks({
    'categories': {
        type: 'many',
        collection: Categories,
        field: 'categoryIds',
    }
})
```

In this case, `categoryIds` is an array of strings (`[categoryId1, categoryId2, ...]`), each string, representing `_id` from `Categories` collection.

Let's also create an inversed link from `Categories`, so you can use it inside the `query`

```js
// file: /imports/db/posts/links.js
import Categories from '...';
import Posts from '...';

Categories.addLinks({
    'posts': {
        collection: Posts,
        inversedBy: 'categories'
    }
})
```

By defining this, I can query for a category, and get all the posts it has.

## Link Loopback

No one stops you from linking a collection to itself, say you have a list of friends which are also users:

```js
Meteor.users.addLinks({
    friends: {
        collection: Meteor.users,
        type: 'many',
        field: 'friendIds',
    }
});
```

Say you want to get your friends, and friends of friends, and friends of friends of friends!
```js
Meteor.users.createQuery({
    $: {
      filters: {_id: userId},
    },
    friends: {
        nickname: 1,
        friends: {
            nickname: 1,
            friends: {
                nickname: 1,
            }
        }
    } 
});
```

## Uniqueness

The `type: 'one'` doesn't necessarily guarantee uniqueness from the inversed side.

For example, we have `Comments` and `Posts` linked, by defining a `one` link from Comments to Posts,
and an inversed link from Posts to Comments.

When you fetch comments, from posts, the inversed side, they will return an array.

But if you want to have a `OneToOne` relationship, and you want Grapher to give you a single object in return,
you can do:

```js
Meteor.users.addLinks({
    paymentProfile: {
        collection: PaymentProfiles,
        inversedBy: 'user'
    }
});

PaymentProfiles.addLinks({
    user: {
        field: 'userId',
        collection: Meteor.users,
        type: 'one',
        unique: true
    }
})
```

Now fetching:
```js
Meteor.users.createQuery({
    paymentProfile: {
        type: 1,
        last4digits: 1,
    } 
});
```

`paymentProfile` inside `user` will be an object because it knows it should be unique.

## Foreign field

When you add a link by default grapher tries to match against `_id` of the linked collection.

Consider a system with two collections:

- `Appointments` - a collection of appointments with startDate, endDate, etc.
- `Tasks` - a collection of tasks which has `referenceId` field which is `_id` of the appointment or some other entity. Tasks generally don't know anything about the appointment, they just have a reference to it.

We can utilize `foreignField` option and do this:

```js
Appointments.addLinks({
  tasks: {
    collection: Tasks,
    type: "many",
    field: "_id", // field from Appointments collection
    foreignField: "referenceId", // field from Tasks collection
  },
});
```

Now you can query for appointments and get all tasks for each appointment:

```js
await Appointments.createQuery({
    $: {
      filters: { ... },
    },
    tasks: {
        title: 1,
    },
    startDate: 1,
    endDate: 1,
}).fetchAsync();
```

If your foreign field is unique inside linked collection (in this case Tasks), you can use `type: "one"` and get a single task instead of an array.

## Indexing

As a rule of thumb, you must index all of your links. Because that's how you achieve absolute performance.

This is not done by default, to allow the developer flexibility, but you can do it simply enough from the direct side definition of the link:

```js
PaymentProfiles.addLinks({
    user: {
        field: 'userId',
        collection: Meteor.users,
        type: 'one',
        unique: true,
        index: true,
    }
})
```

The index is applied only on the `_id`, meaning that if you have `meta` links, other fields present in that object will not be indexed,
but you can run a `Collection.createIndex` separately.

If you have `unique: true` set, the index will also apply a unique constraint to it.

## Top Level vs Nested Fields

Grapher supports both top level and nested fields for storing linking data.
Top level fields are **recommended** because we believe developer should think relational and 
eliminate large and complex documents by abstracting them into collections.

Support for nested fields is here only for cases where no other solution is possible, for example when working with
other packages that require you to store your data inside an object.

## Conclusion

Using these simple techniques, you can create a beautiful database schemas inside MongoDB that are relational and very simple to fetch,
you will eliminate almost all your boilerplate code around this and allows you to focus on more important things.

## [Query Options](query_options.md) or [Back to Table of Contents](index.md)









