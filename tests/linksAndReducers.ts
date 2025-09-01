import { Tinytest } from "meteor/tinytest";

import { Users, Posts, Comments } from "./setup";




Tinytest.addAsync("Links and reducers - posts and comments", async (test, done) => {
  await Users.removeAsync({});
  await Posts.removeAsync({});
  await Comments.removeAsync({});

  const userId = await Users.insertAsync({ username: "testuser" });
  const postId1 = await Posts.insertAsync({ title: "Post 1", authorId: userId });
  const postId2 = await Posts.insertAsync({ title: "Post 2", authorId: userId });
  await Comments.insertAsync({ content: "Comment 1", postId: postId1, authorId: userId });
  await Comments.insertAsync({ content: "Comment 2", postId: postId1, authorId: userId });
  await Comments.insertAsync({ content: "Comment 3", postId: postId2, authorId: userId });

  const user = await Users.createQuery("mainUser", {
    // $filters: {
    //   _id: userId,
    // },
    // $paginate: true,

    username: true,
    posts: {
      title: true,
      comments: {
        content: true,
      },
    },
    postCount: true,
    commentCount: true,
  }).fetchOneAsync();

  test.equal(user.username, "testuser", "Should fetch the correct user");
  test.equal(user.posts.length, 2, "User should have 2 posts");
  test.equal(user.posts[0].comments.length, 2, "First post should have 2 comments");
  test.equal(user.posts[1].comments.length, 1, "Second post should have 1 comment");
  test.equal(user.postCount, 2, "postCount should be 2");
  test.equal(user.commentCount, 3, "commentCount should be 3");
  done();
});