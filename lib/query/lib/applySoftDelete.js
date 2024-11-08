import isObject from "lodash/isObject";
import { Mongo } from "meteor/mongo";


export default function applySoftDelete(collection, body, params) {
  if (!body.$filters) {
    body.$filters = {};
  }

  if (collection._softDelete && body.$filters.isDeleted === undefined) {
    Object.assign(body.$filters, {
      isDeleted: false,
    });
  }

  Object.entries(body).forEach(([key, value]) => {
    if (isObject(value)) {
      const collection = Mongo.collections[key];

      if (!collection) {
        return;
      }

      return applySoftDelete(collection, value, params);
    }
  });
}
