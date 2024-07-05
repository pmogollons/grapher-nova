import { Meteor } from "meteor/meteor";

import NamedQueryClient from "./namedQuery.client";
import NamedQueryServer from "./namedQuery.server";

let NamedQuery;

if (Meteor.isServer) {
  NamedQuery = NamedQueryServer;
} else {
  NamedQuery = NamedQueryClient;
}

export default NamedQuery;
