import { Mongo } from "meteor/mongo";
import { Tinytest } from "meteor/tinytest";


const Contacts = new Mongo.Collection("contacts");

const onBeforeEach = async () => {
  await Contacts.removeAsync({});
  await Contacts.insertAsync({ name: "John Doe", age: 30 });
  await Contacts.insertAsync({ name: "Jane Smith", age: 25 });
  await Contacts.insertAsync({ name: "Bob Johnson", age: 35 });
};

Tinytest.addAsync("Collection Queries - paginate and filter function", async (test) => {
  await onBeforeEach();

  const query = Contacts
    .createQuery({
      $filter({ filters, params }) {
        filters.age = {
          $gte: params.age,
        };
      },
      $options: {
        sort: { age: 1 },
      },
      $paginate: true,

      name: true,
    });

  const results = await query.clone({ age: 30 }).fetchAsync();

  test.equal(results.length, 2);
  test.equal(results[0].name, "John Doe");
  test.equal(results[1].name, "Bob Johnson");

  const results1 = await query.clone({ age: 30, limit: 1 }).fetchAsync();

  test.equal(results1.length, 1);
  test.equal(results1[0].name, "John Doe");

  const results2 = await query.clone({ age: 30, limit: 1, skip: 1 }).fetchAsync();

  test.equal(results2.length, 1);
  test.equal(results2[0].name, "Bob Johnson");
});

Tinytest.addAsync("Collection Queries - filters", async (test) => {
  await onBeforeEach();

  const results = await Contacts.createQuery({
    $filters: {
      age: {
        $lt: 35,
      },
    },

    name: true,
  }).fetchAsync();

  test.equal(results.length, 2);
  test.include(results.map(r => r.name), "John Doe");
  test.include(results.map(r => r.name), "Jane Smith");
});

Tinytest.addAsync("Collection Queries - options", async (test) => {
  const results = await Contacts.createQuery({
    $options: {
      sort: {
        age: -1,
      },
    },

    name: true,
  }).fetchAsync();

  test.equal(results.length, 3);
  test.equal(results[0].name, "Bob Johnson");
});

Tinytest.addAsync("Collection Queries - pagination", async (test) => {
  const query = Contacts.createQuery({
    $paginate: true,
  }).clone({ skip: 1, limit: 2 });
  const results = await query.fetchAsync();
  const count = await query.getCountAsync();

  test.equal(results.length, 2);
  test.equal(count, 3);
});

// TODO: Test deep filter() on linked collections
// TODO: Test softDelete query
// TODO: Test $search. This requires an atlas mongodb instance with search indexes