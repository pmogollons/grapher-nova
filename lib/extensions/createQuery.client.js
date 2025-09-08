import { Mongo } from "meteor/mongo";

import NamedQuery from "../namedQuery/namedQuery.client";
import NamedQueryStore from "../namedQuery/store.js";


Object.assign(Mongo.Collection.prototype, {
  createQuery(...args) {
    if (typeof args[0] === "string") {
      const [name, body, options] = args;
      const query = new NamedQuery(name, this, body, options);
      NamedQueryStore.add(name, query);

      return query;
    } else {
      console.warn("Query is not implemented in the client.");
    }
  },
});