# Search

Similarly to how you can use `$paginate` option you can use `$search`. It will 
take a config object and automatically use the `searchText` param to search with 
the specified index.

For example:
```js
Collection.createQuery("myNamedQuery", {
    $filter({ filters, params }) {
        filters.orgId = params.orgId;
    },
    $search: {
        index: "guests", // atlas search index name
        path: ["name", "idNumber", "licensePlate"],
        isCompound: true,
    },
})
```

This will automatically take the `params.seachText` field if provided and add
a search stage to the query pipeline. It will also sort the results by `searchScore: -1`.

Compound makes this query to be "compound" meaning it will treat the other filters also as 
part of the search query using `mustNot` and `filter`.

If you dont supply a path it will use `wildcard: "*"` as the path.

## Search "engines"

You can use one of three modes when searching. You can use atlas search indexes, `$text` indexes
and `$regex` (not recommended).

## $text index search

For example, if you want to use a $text index you can set it like this:
```js
Collection.createQuery("myNamedQuery", {
    $filter({ filters, params }) {
        filters.orgId = params.orgId;
    },
    $search: {
        index: "$text", // for text indexes
        language: "string",
        caseSensitive: false,
        diacriticSensitive: false,
    },
})
```

* The results will be sorted by default by `textScore: -1`.

## $regex search

Also, if you have a small collection in which you want to have something like a fuzzy match
you could use $regex search like this:
```js
Collection.createQuery("myNamedQuery", {
    $filter({ filters, params }) {
        filters.orgId = params.orgId;
    },
    $search: {
        index: "$regex", // for text indexes
        path: ["name", "idNumber", "licensePlate"], // string or array of strings
    },
})
```

This search will find any docs that fuzzy match the name, idNumber or licensePlate fields.

* I personally wont use this unless is for a tiny collection where you dont have more 
than 100 docs.