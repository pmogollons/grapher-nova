import { Meteor } from "meteor/meteor";

import { createQueryClient } from "./createQuery.client";
import { createQueryServer } from "./createQuery.server";


let createQuery;

if (Meteor.isServer) {
  createQuery = createQueryServer;
} else {
  createQuery = createQueryClient;
}

export { createQuery };
