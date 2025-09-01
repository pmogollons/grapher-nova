import { Meteor } from "meteor/meteor";
import { Tinytest } from "meteor/tinytest";

import { Users, Posts } from "./setup";


const onBeforeEach = async () => {
  await Users.removeAsync({});
  await Posts.removeAsync({});

  // Insert test users
  await Users.insertAsync({
    username: "john_doe",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    age: 30,
    tags: ["developer", "javascript", "meteor"],
    bio: "Full-stack developer with expertise in JavaScript and Meteor",
    isActive: true,
    createdAt: new Date("2023-01-01"),
  });

  await Users.insertAsync({
    username: "jane_smith",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Smith",
    age: 25,
    tags: ["designer", "ui", "ux"],
    bio: "Creative UI/UX designer passionate about user experience",
    isActive: true,
    createdAt: new Date("2023-02-01"),
  });

  await Users.insertAsync({
    username: "bob_wilson",
    email: "bob@example.com",
    firstName: "Bob",
    lastName: "Wilson",
    age: 35,
    tags: ["developer", "python", "data"],
    bio: "Data scientist and Python developer",
    isActive: false,
    createdAt: new Date("2023-03-01"),
  });

  // Insert test posts
  await Posts.insertAsync({
    title: "Getting Started with Meteor",
    content: "Meteor is a full-stack JavaScript platform for building web and mobile applications.",
    authorId: "john_doe",
    tags: ["meteor", "javascript", "tutorial"],
    category: "development",
    publishedAt: new Date("2023-01-15"),
    isPublished: true,
  });

  await Posts.insertAsync({
    title: "UI Design Principles",
    content: "Understanding the fundamental principles of good UI design is crucial for creating effective user interfaces.",
    authorId: "jane_smith",
    tags: ["design", "ui", "principles"],
    category: "design",
    publishedAt: new Date("2023-02-15"),
    isPublished: true,
  });

  await Posts.insertAsync({
    title: "Data Analysis with Python",
    content: "Python provides powerful tools for data analysis and visualization.",
    authorId: "bob_wilson",
    tags: ["python", "data", "analysis"],
    category: "data-science",
    publishedAt: new Date("2023-03-15"),
    isPublished: false,
  });
};

Tinytest.addAsync("Named Queries - Basic functionality with $filters", async (test) => {
  await onBeforeEach();

  // Create a named query
  const usersActiveQuery = Users.createQuery("getActiveUsers", {
    $filters: {
      isActive: true,
    },
    $options: {
      sort: { createdAt: -1 },
    },
    username: true,
    firstName: true,
    lastName: true,
    age: true,
  });

  // Test basic fetch
  const results = await usersActiveQuery.fetchAsync();
  test.equal(results.length, 2);
  test.equal(results[0].username, "jane_smith"); // Most recent first
  test.equal(results[1].username, "john_doe");
});

Tinytest.addAsync("Named Queries - Basic functionality with $filter function", async (test) => {
  await onBeforeEach();

  // Test clone with new params
  const olderUsersQuery = Users.createQuery("getOlderUsers", {
    $filter({ filters, params }) {
      filters.age = { $gt: params.age };
    },
    $options: {
      sort: { createdAt: -1 },
    },
    username: true,
    firstName: true,
    lastName: true,
    age: true,
  });

  const olderResults = await olderUsersQuery.clone({ age: 30 }).fetchAsync();
  test.equal(olderResults.length, 1);
  test.equal(olderResults[0].username, "bob_wilson");

  // Test fetchOne
  const oneUser = await olderUsersQuery.clone({ age: 30 }).fetchOneAsync();
  test.equal(oneUser.username, "bob_wilson");

  // Test count
  const count = await olderUsersQuery.clone({ age: 30 }).getCountAsync();
  test.equal(count, 1);
});

Tinytest.addAsync("Named Queries - Sorting", async (test) => {
  await onBeforeEach();

  const userQuery = Users.createQuery("getAllUsers", {
    $options: {
      sort: { age: -1 },
    },
    username: true,
    age: true,
  });

  // Test sorting
  const results = await userQuery.fetchAsync();
  test.equal(results.length, 3);
  test.equal(results[0].username, "bob_wilson");
  test.equal(results[1].username, "john_doe");
  test.equal(results[2].username, "jane_smith");
});

Tinytest.addAsync("Named Queries - Pagination", async (test) => {
  await onBeforeEach();

  const userQuery = Users.createQuery("getAllPaginatedUsers", {
    $paginate: true,
    $options: {
      sort: { age: -1 },
    },

    username: true,
    age: true,
  });

  // Test pagination
  const page1 = await userQuery.clone({ limit: 2, skip: 0 }).fetchAsync();
  const page2 = await userQuery.clone({ limit: 2, skip: 2 }).fetchAsync();
  const totalCount = await userQuery.clone({ limit: 2, skip: 0 }).getCountAsync();

  test.equal(page1.length, 2);
  test.equal(page2.length, 1);
  test.equal(totalCount, 3);

  test.equal(page1[0].username, "bob_wilson");
  test.equal(page1[1].username, "john_doe");
  test.equal(page2[0].username, "jane_smith");
  test.equal(page2[1]?.username, undefined);
});

Tinytest.addAsync("Named Queries - $text search", async (test) => {
  await onBeforeEach();

  const userQuery = Users.createQuery("searchUsers", {
    $search: {
      index: "$text",
    },
    username: true,
    firstName: true,
    lastName: true,
    bio: true,
  });

  // Test text search
  const results = await userQuery.clone({ searchText: "developer" }).fetchAsync();
  test.equal(results.length, 2);
  test.include(results.map(r => r.username), "john_doe");
  test.include(results.map(r => r.username), "bob_wilson");

  // Test case insensitive search
  const caseResults = await userQuery.clone({ searchText: "JAVASCRIPT" }).fetchAsync();
  test.equal(caseResults.length, 1);
  test.equal(caseResults[0].username, "john_doe");

  // Test search with no results
  const noResults = await userQuery.clone({ searchText: "nonexistent" }).fetchAsync();
  test.equal(noResults.length, 0);
});

Tinytest.addAsync("Named Queries - $regex search", async (test) => {
  await onBeforeEach();

  const userQuery = Users.createQuery("searchUsersRegex", {
    $search: {
      index: "$regex",
      path: ["username", "firstName", "lastName", "email"],
    },
    username: true,
    firstName: true,
    lastName: true,
    email: true,
  });

  // Test regex search
  const results = await userQuery.clone({ searchText: "john" }).fetchAsync();
  test.equal(results.length, 1);
  test.equal(results[0].username, "john_doe");

  // Test partial match
  const partialResults = await userQuery.clone({ searchText: "doe" }).fetchAsync();
  test.equal(partialResults.length, 1);
  test.equal(partialResults[0].username, "john_doe");

  // Test numeric search (regex also supports numeric matching)
  // const numericResults = await userQuery.clone({ searchText: "30" }).fetchAsync();
  // test.equal(numericResults.length, 1);
  // test.equal(numericResults[0].username, "john_doe");

  // Test multiple field search
  const multiResults = await userQuery.clone({ searchText: "smith" }).fetchAsync();
  test.equal(multiResults.length, 1);
  test.equal(multiResults[0].username, "jane_smith");
});

Tinytest.addAsync("Named Queries - Atlas Search with default wildcard", async (test) => {
  await onBeforeEach();
  await Meteor.sleep(1000); // Wait for the index to be ready

  const userQuery = Users.createQuery("searchUsersAtlasSearch", {
    $search: {
      index: "users",
    },
    username: true,
    firstName: true,
    lastName: true,
    tags: true,
  });

  const results = await userQuery.clone({ searchText: "developer" }).fetchAsync();

  test.equal(results.length, 2);
  test.include(results.map(r => r.username), "john_doe");
  test.include(results.map(r => r.username), "bob_wilson");
});

Tinytest.addAsync("Named Queries - Atlas Search with explicit path", async (test) => {
  await onBeforeEach();
  await Meteor.sleep(1000); // Wait for the index to be ready

  const userQuery = Users.createQuery("searchUsersAtlasSearchPath", {
    $search: {
      index: "users",
      path: ["username", "firstName", "lastName", "tags"],
    },
    username: true,
    firstName: true,
    lastName: true,
    tags: true,
  });

  const results = await userQuery.clone({ searchText: "developer" }).fetchAsync();

  test.equal(results.length, 2);
  test.include(results.map(r => r.username), "john_doe");
  test.include(results.map(r => r.username), "bob_wilson");
});

Tinytest.addAsync("Named Queries - Atlas Search with compound filters", async (test) => {
  await onBeforeEach();
  await Meteor.sleep(1000); // Wait for the index to be ready

  const userQuery = Users.createQuery("searchUsersAtlasSearchCompound", {
    $filter({ filters, params }) {
      filters.isActive = params.isActive;
    },
    $search: {
      index: "usersV2",
      path: ["username", "firstName", "lastName", "tags"],
      isCompound: true,
    },
    username: true,
    firstName: true,
    lastName: true,
    tags: true,
    isActive: true,
  });

  const results = await userQuery.clone({ searchText: "developer", isActive: true }).fetchAsync();

  test.equal(results.length, 1);
  test.equal(results[0].username, "john_doe");
});

Tinytest.addAsync("Named Queries - Complex filters and options", async (test) => {
  await onBeforeEach();

  const userQuery = Users.createQuery("getFilteredUsers", {
    $filter({ filters, params }) {
      if (params.activeOnly) {
        filters.isActive = true;
      }
      if (params.minAge) {
        filters.age = { $gte: params.minAge };
      }
      if (params.tags && params.tags.length > 0) {
        filters.tags = { $in: params.tags };
      }
    },
    $options: {
      sort: { age: 1 },
    },
    username: true,
    age: true,
    tags: true,
    isActive: true,
  });

  // Test complex filtering
  const results = await userQuery.clone({
    activeOnly: true,
    minAge: 25,
    tags: ["developer"],
  }).fetchAsync();

  test.equal(results.length, 1);
  test.equal(results[0].username, "john_doe");
  test.equal(results[0].age, 30);
  test.isTrue(results[0].isActive);
  test.include(results[0].tags, "developer");
});

Tinytest.addAsync("Named Queries - Resolver query", async (test) => {
  await onBeforeEach();

  const resolverQuery = Users.createQuery("getUserStats", async () => {
    const totalUsers = await Users.find({}).countAsync();
    const activeUsers = await Users.find({ isActive: true }).countAsync();
    const averageAge = await Users.rawCollection().aggregate([
      { $group: { _id: null, avgAge: { $avg: "$age" } } },
    ]).toArray();

    return {
      totalUsers,
      activeUsers,
      averageAge: averageAge[0]?.avgAge || 0,
    };
  });

  const stats = await resolverQuery.fetchAsync();

  test.equal(stats.totalUsers, 3);
  test.equal(stats.activeUsers, 2);
  test.equal(stats.averageAge, 30);
});

Tinytest.addAsync("Named Queries - Search score sorting", async (test) => {
  await onBeforeEach();

  const scoredQuery = Users.createQuery("scoredSearch", {
    $search: {
      index: "$text",
    },
    username: true,
    firstName: true,
    lastName: true,
    bio: true,
    tags: true,
  });

  // Test search with scoring
  const results = await scoredQuery.clone({ searchText: "developer doe" }).fetchAsync();

  if (results.length > 0) {
    // Verify results are sorted by score (highest first)
    test.isTrue(results.length >= 1);
    // The first result should be the most relevant match
    test.equal(results[0].username, "john_doe");
    test.equal(results[1].username, "bob_wilson");
  }
});

Tinytest.addAsync("Named Queries - Search with language options", async (test) => {
  await onBeforeEach();

  const languageQuery = Users.createQuery("languageSearch", {
    $search: {
      index: "$text",
      path: ["username", "firstName", "lastName"],
      language: "english",
      caseSensitive: false,
      diacriticSensitive: false,
    },
    username: true,
    firstName: true,
    lastName: true,
  });

  // Test language-specific search
  const results = await languageQuery.clone({ searchText: "developer" }).fetchAsync();
  test.equal(results.length, 2); // Should find both developers

  // Test case insensitive search
  const caseResults = await languageQuery.clone({ searchText: "DEVELOPER" }).fetchAsync();
  test.equal(caseResults.length, 2);
});

Tinytest.addAsync("Named Queries - Search with case sensitive", async (test) => {
  await onBeforeEach();

  const languageQuery = Users.createQuery("languageSearchCaseSensitive", {
    $search: {
      index: "$text",
      path: ["username", "firstName", "lastName"],
      language: "english",
      caseSensitive: true,
      diacriticSensitive: false,
    },
    username: true,
    firstName: true,
    lastName: true,
  });

  // Test language-specific search
  const results = await languageQuery.clone({ searchText: "developer" }).fetchAsync();
  test.equal(results.length, 2); // Should find both developers

  // Test case insensitive search
  const caseResults = await languageQuery.clone({ searchText: "DEVELOPER" }).fetchAsync();
  test.equal(caseResults.length, 0);
});

Tinytest.addAsync("Named Queries - Search with specific field paths", async (test) => {
  await onBeforeEach();

  const specificPathQuery = Users.createQuery("specificPathSearch", {
    $search: {
      index: "$regex",
      path: ["email"],
    },
    username: true,
    email: true,
  });

  // Test search in specific fields only
  const results = await specificPathQuery.clone({ searchText: "john" }).fetchAsync();
  test.equal(results.length, 1);
  test.equal(results[0].username, "john_doe");
  test.equal(results[0].email, "john@example.com");

  // Search should not match in firstName/lastName/username since they're not in path
  const nameResults = await specificPathQuery.clone({ searchText: "doe" }).fetchAsync();
  test.equal(nameResults.length, 0); // "doe" is in username/lastName, not email
});

Tinytest.addAsync("Named Queries - Search with numeric and text", async (test) => {
  await onBeforeEach();

  const mixedQuery = Users.createQuery("mixedSearch", {
    $search: {
      index: "$regex",
      path: ["username", "firstName", "lastName", "age"],
    },
    username: true,
    firstName: true,
    lastName: true,
    age: true,
  });

  // Test numeric search
  const ageResults = await mixedQuery.clone({ searchText: "30" }).fetchAsync();
  test.equal(ageResults.length, 1);
  test.equal(ageResults[0].age, 30);

  // Test text search
  const textResults = await mixedQuery.clone({ searchText: "smith" }).fetchAsync();
  test.equal(textResults.length, 1);
  test.equal(textResults[0].lastName, "Smith");

  // Test combined search
  const combinedResults = await mixedQuery.clone({ searchText: "25" }).fetchAsync();
  test.equal(combinedResults.length, 1);
  test.equal(combinedResults[0].age, 25);
});
