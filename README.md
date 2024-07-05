# Grapher 2.0 [(Using bluelibs nova)](https://www.bluelibs.com/docs/package-nova)

_Grapher_ is a Data Fetching Layer on top of Meteor and MongoDB. It is production ready and battle tested.

How to install:
```bash
mkdir packages
cd packages
git clone https://github.com/pmogollons/grapher.git
```

Companion packages
* [grapher-react](https://github.com/pmogollons/grapher.git)
* grapher-react-native

### Diffferences with the original Grapher:
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

Main features:

*   Innovative way to make MongoDB relational
*   Incredible performance
*   Connection to external data sources
*   Usable from anywhere

It marks a stepping stone into evolution of data, enabling developers to write complex and secure code,
while maintaining the code base easy to understand.

[Read more about the GraphQL Bridge](docs/graphql.md)

## Installation

```
meteor add cultofcoders:grapher
```

## [Documentation](docs/index.md)

This provides a learning curve for Grapher and it explains all the features. If you want to visualize the documentation better, check it out here:

https://cult-of-coders.github.io/grapher/

## [API](docs/api.md)

Grapher cheatsheet, after you've learned it's powers this is the document will be very useful.

## Useful packages

*   Live View: https://github.com/cult-of-coders/grapher-live
*   Graphical Grapher: https://github.com/Herteby/graphical-grapher
*   React HoC: https://github.com/cult-of-coders/grapher-react
*   VueJS: https://github.com/Herteby/grapher-vue

### Events for Meteor (+ Grapher, Redis Oplog and GraphQL/Apollo)

*   Meteor Night 2018: [Arguments for Meteor](https://drive.google.com/file/d/1Tx9vO-XezO3DI2uAYalXPvhJ-Avqc4-q/view) - Theodor Diaconu, CEO of Cult of Coders: “Redis Oplog, Grapher, and Apollo Live.

## Contributors

This project exists thanks to all the people who contribute. [[Contribute]](CONTRIBUTING.md).
<a href="graphs/contributors"><img src="https://opencollective.com/grapher/contributors.svg?width=890" /></a>


## Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/grapher#backer)]

<a href="https://opencollective.com/grapher#backers" target="_blank"><img src="https://opencollective.com/grapher/backers.svg?width=890"></a>


## Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/grapher#sponsor)]

<a href="https://opencollective.com/grapher/sponsor/0/website" target="_blank"><img src="https://opencollective.com/grapher/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/grapher/sponsor/1/website" target="_blank"><img src="https://opencollective.com/grapher/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/grapher/sponsor/2/website" target="_blank"><img src="https://opencollective.com/grapher/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/grapher/sponsor/3/website" target="_blank"><img src="https://opencollective.com/grapher/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/grapher/sponsor/4/website" target="_blank"><img src="https://opencollective.com/grapher/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/grapher/sponsor/5/website" target="_blank"><img src="https://opencollective.com/grapher/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/grapher/sponsor/6/website" target="_blank"><img src="https://opencollective.com/grapher/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/grapher/sponsor/7/website" target="_blank"><img src="https://opencollective.com/grapher/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/grapher/sponsor/8/website" target="_blank"><img src="https://opencollective.com/grapher/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/grapher/sponsor/9/website" target="_blank"><img src="https://opencollective.com/grapher/sponsor/9/avatar.svg"></a>

### Quick Illustration

Query:

```js
createQuery({
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
}).fetch();
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

### Testing

You can create `test` directory and configure dependencies (working directory is the root of this repo):
```
# create meteor app for testing
# you can add a specific release with --release flag, this will just create the app with the latest release
meteor create --bare test 
cd test
# install npm dependencies used for testing
meteor npm i --save selenium-webdriver@3.6.0 chromedriver@2.36.0 simpl-schema@1.13.1 chai

# Running tests (always from ./test directory)
METEOR_PACKAGE_DIRS="../" TEST_BROWSER_DRIVER=chrome meteor test-packages --once --driver-package meteortesting:mocha ../
```

If you use `TEST_BROWSER_DRIVER=chrome` you have to have chrome installed in the test environment. Otherwise, you can just run tests in your browser.

Another option is to use `puppeteer` as a driver. You'll have to install it with `meteor npm i puppeteer@10`. Note that the latest versions don't work with Node 14.

With `--port=X` you can run tests on port X.

Omit `--once` and mocha will run in watch mode.
