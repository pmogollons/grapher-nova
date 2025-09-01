import { Mongo } from "meteor/mongo";
import { Meteor } from "meteor/meteor";


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

export const Users = Meteor.users;
export const Posts = new Mongo.Collection<IPost, IPostExt>("posts");
export const Comments = new Mongo.Collection<IComment, ICommentExt>("comments");
export const Subscriptions = new Mongo.Collection<ISubscription, ISubscriptionExt>("subscriptions");

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

await Users.createIndexAsync({
  username: "text",
  firstName: "text",
  lastName: "text",
  bio: "text",
});

await Users.rawCollection().createSearchIndex({
  name: "users",
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        username: {
          type: "string",
        },
        email: {
          type: "string",
        },
        firstName: {
          type: "string",
        },
        lastName: {
          type: "string",
        },
        bio: {
          type: "string",
        },
        tags: {
          type: "string",
        },
        createdAt: {
          type: "date",
        },
      },
    },
  },
});

await Users.rawCollection().createSearchIndex({
  name: "usersV2",
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        username: {
          type: "string",
        },
        email: {
          type: "string",
        },
        firstName: {
          type: "string",
        },
        lastName: {
          type: "string",
        },
        bio: {
          type: "string",
        },
        tags: {
          type: "string",
        },
        isActive: {
          type: "boolean",
        },
        createdAt: {
          type: "date",
        },
      },
    },
  },
});