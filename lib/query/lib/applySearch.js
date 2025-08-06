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

  if (!$search?.index) {
    throw new Meteor.Error("BAD_REQUEST", "Missing search index");
  }

  if ($search.index === "$text") {
    return searchWithTextIndex(body, _params, $search);
  }

  if ($search.index === "$regex") {
    return searchWithRegex(body, _params, $search);
  }

  return searchWithAtlasSearch(body, _params, $search);
}

function searchWithTextIndex(body, _params, $search) {
  Object.assign(body.$filters, {
    $text: {
      $search: _params.searchText,
      $language: $search.language,
      $caseSensitive: $search.caseSensitive,
      $diacriticSensitive: $search.diacriticSensitive,
    },
  });

  Object.assign({
    score: { $meta: "textScore" },
  }, body.$options.sort || {});
}

function searchWithAtlasSearch(body, _params, $search) {
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
        sort: {
          score: { $meta: "searchScore" },
          ...(body.$options.sort || {}),
        },
      },
    });
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
        sort: {
          score: { $meta: "searchScore" },
          ...(body.$options.sort || {}),
        },
      },
    });
  }
}

function searchWithRegex(body, _params, $search) {
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
