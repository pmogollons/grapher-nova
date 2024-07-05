import { Meteor } from "meteor/meteor";

import convertFiltersToCompound from "./convertFiltersToCompound";


const UNSUPPORTED_OPERATORS = ["$nor", "$type", "$expr", "$regex", "$jsonSchema", "$mod",
  "$and", "$or", "$text", "$where", "$geoIntersects", "$geoWithin", "$near", "$nearSphere",
  "$all", "$elemMatch", "$size", "$bitsAllClear", "$bitsAllSet", "$bitsAnyClear", "$bitsAnySet"];

export default function applySearch(collection, body, _params) {
  const $search = body.$search && { ...body.$search };
  delete body["$search"];

  if (!$search || !_params.searchText) {
    return;
  }

  if (!body.$filters) {
    body.$filters = {};
  }

  if (!body.$options) {
    body.$options = {};
  }

  if (Meteor.isDevelopment && (process.env.MONGO_URL?.includes("localhost") || process.env.MONGO_URL?.includes("127.0.0.1"))) {
    return searchInDev(body, _params, $search);
  }

  if (!$search?.index) {
    throw new Meteor.Error("BAD_REQUEST", "Missing search index");
  }

  const hasUnsupportedOperators = Object.keys(body.$filters).some((key) => {
    return UNSUPPORTED_OPERATORS.includes(key);
  });

  if (hasUnsupportedOperators) {
    console.warn("Unsupported operators in $search", body.$filters);
  }

  if ($search.isCompound && !hasUnsupportedOperators) {
    const { filter, mustNot } = convertFiltersToCompound(body.$filters);

    Object.assign(body.$filters, {
      $search: {
        index: `${Meteor.settings.env || "BETA"}_${$search?.index}`,
        compound: {
          must: [{
            text: {
              query: _params.searchText,
              path: $search?.path || {
                "wildcard": "*",
              },
            },
          }],
          mustNot,
          filter,
        },
      },
    });

    body.$options.sort = { searchScore: -1 };
  } else {
    Object.assign(body.$filters, {
      $search: {
        index: `${Meteor.settings.env || "BETA"}_${$search?.index}`,
        text: {
          query: _params.searchText,
          path: $search?.path || {
            "wildcard": "*",
          },
        },
      },
    });

    body.$options.sort = { searchScore: -1 };
  }
}

function searchInDev(body, _params, $search) {
  let fields = $search.path;

  if (typeof fields === "string") {
    fields = [fields];
  }

  if (!Array.isArray(fields) || fields.length === 0) {
    return;
  }

  body.$filters.$or = [];

  fields.forEach((field) => {
    body.$filters.$or.push({ [field]: { $regex: _params.searchText, $options: "i" } });
    body.$filters.$or.push({ [field]: Number(_params.searchText) });
  });
}
