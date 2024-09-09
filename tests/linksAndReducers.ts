import { Mongo } from "meteor/mongo";
import { Meteor } from "meteor/meteor";
import { Tinytest } from "meteor/tinytest";


interface IUser {
  _id: string;
  username: string;
}

interface IComment {
  _id: string;
  content: string;
  postId: string;
  authorId: string;
}

interface ICommentExt extends IComment {
  post: IPost;
  author: IUser;
}

interface IPost {
  _id: string;
  title: string;
  authorId: string;
}

interface IPostExt extends IPost {
  comments: ICommentExt[];
  author: IUser;
}

interface ISubscription {
  _id: string;
  name: string;
  userId: string;
}

interface ISubscriptionExt extends ISubscription {
  subscriber: IUser;
}

const Users = Meteor.users;
const Posts = new Mongo.Collection<IPost, IPostExt>("posts");
const Comments = new Mongo.Collection<IComment, ICommentExt>("comments");
const Subscriptions = new Mongo.Collection<ISubscription, ISubscriptionExt>("subscriptions");

Users.addLinks({
  subscriptions: {
    collection: Subscriptions,
    inversedBy: "subscriber",
  },
  posts: {
    collection: Posts,
    inversedBy: "author",
  },
});

Subscriptions.addLinks({
  subscriber: {
    collection: Users,
    field: "userId",
  },
});

Posts.addLinks({
  author: {
    collection: Users,
    field: "authorId",
  },
  comments: {
    collection: Comments,
    inversedBy: "post",
  },
});

Comments.addLinks({
  post: {
    collection: Posts,
    field: "postId",
  },
  author: {
    collection: Users,
    field: "authorId",
  },
});

Posts.addReducers({
  commentCount: {
    dependency: {
      comments: {
        _id: true,
      },
    },
    async reduce(post) {
      const { comments = [] } = post;

      return comments.length;
    },
  },
});


Users.addReducers({
  postCount: {
    dependency: {
      posts: {
        _id: true,
      },
    },
    async reduce({ posts = [] }) {
      return posts.length;
    },
  },
  commentCount: {
    dependency: {
      posts: {
        comments: {
          _id: true,
        },
      },
    },
    async reduce(user) {
      const { posts = [] } = user;

      return posts.reduce((count, post) => count + (post.comments?.length || 0), 0);
    },
  },
});

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

  const user = await Users.createQuery({
    $filters: {
      _id: userId,
    },
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

Tinytest.addAsync("Links and reducers - subscriptions", async (test, done) => {
  await Users.removeAsync({});
  await Subscriptions.removeAsync({});

  const userId = await Users.insertAsync({ username: "subscriber" });
  await Subscriptions.insertAsync({ name: "Sub 1", userId });
  await Subscriptions.insertAsync({ name: "Sub 2", userId });

  const user = await Users.createQuery({
    $filters: {
      _id: userId,
    },
    username: true,
    subscriptions: {
      name: true,
    },
  }).fetchOneAsync();

  test.equal(user.username, "subscriber", "Should fetch the correct user");
  test.equal(user.subscriptions.length, 2, "User should have 2 subscriptions");
  test.equal(user.subscriptions[0].name, "Sub 1", "Should have correct subscription name");
  test.equal(user.subscriptions[1].name, "Sub 2", "Should have correct subscription name");
  done();
});

Tinytest.addAsync("Links and reducers - author and comments", async (test, done) => {
  await Users.removeAsync({});
  await Posts.removeAsync({});
  await Comments.removeAsync({});

  const authorId = await Users.insertAsync({ username: "author" });
  const postId = await Posts.insertAsync({ title: "Test Post", authorId });
  await Comments.insertAsync({ content: "Comment 1", postId, authorId });
  await Comments.insertAsync({ content: "Comment 2", postId, authorId });
  await Comments.updateAsync({ postId }, { $set: { content: "Comment 3", postId, authorId } });

  const post = await Posts.createQuery({
    $filters: {
      _id: postId,
    },
    title: true,
    author: {
      username: true,
    },
    comments: {
      content: true,
      author: {
        username: true,
      },
    },
  }).fetchOneAsync();

  test.equal(post.title, "Test Post", "Should fetch the correct post");
  test.equal(post.author?.username, "author", "Should fetch the correct author");
  test.equal(post.comments.length, 2, "Post should have 2 comments");
  test.equal(post.comments[0].author?.username, "author", "Comment should have correct author");
  done();
});

Tinytest.addAsync("Links and reducers - post and author", async (test, done) => {
  await Users.removeAsync({});
  await Posts.removeAsync({});
  await Comments.removeAsync({});

  const authorId = await Users.insertAsync({ username: "commenter" });
  const postId = await Posts.insertAsync({ title: "Commented Post", authorId });
  const commentId = await Comments.insertAsync({ content: "Test Comment", postId, authorId });

  const comment = await Comments.createQuery({
    $filters: {
      _id: commentId,
    },
    content: true,
    post: {
      title: true,
    },
    author: {
      username: true,
    },
  }).fetchOneAsync();

  test.equal(comment.content, "Test Comment", "Should fetch the correct comment");
  test.equal(comment.post.title, "Commented Post", "Should fetch the correct post");
  test.equal(comment.author.username, "commenter", "Should fetch the correct author");
  done();
});
