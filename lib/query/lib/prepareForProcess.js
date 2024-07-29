import { check, Match } from "meteor/check";
import { cloneDeep, isObject, isFunction } from "lodash";

import applySearch from "./applySearch";
import applySoftDelete from "./applySoftDelete";


function defaultFilterFunction({
  filters,
  options,
  params,
}) {
  if (params.filters) {
    Object.assign(filters, params.filters);
  }
  if (params.options) {
    Object.assign(options, params.options);
  }
}

function applyFilterRecursive(data, params = {}, isRoot = false) {
  if (isRoot && !isFunction(data.$filter)) {
    data.$filter = defaultFilterFunction;
  }

  if (data.$filter) {
    check(data.$filter, Match.OneOf(Function, [Function]));

    data.$filters = data.$filters || {};
    data.$options = data.$options || {};

    if (Array.isArray(data.$filter)) {
      data.$filter.forEach(filter => {
        filter.call(null, {
          filters: data.$filters,
          options: data.$options,
          params: params,
        });
      });
    } else {
      data.$filter({
        filters: data.$filters,
        options: data.$options,
        params: params,
      });
    }

    data.$filter = null;
    delete(data.$filter);
  }

  Object.values(data).forEach((value) => {
    if (isObject(value)) {
      return applyFilterRecursive(value, params);
    }
  });
}

function applyPagination(body, _params) {
  if (body["$paginate"] && _params) {
    if (!body.$options) {
      body.$options = {};
    }

    if (_params.limit) {
      Object.assign(body.$options, {
        limit: _params.limit,
      });
    }

    if (_params.skip) {
      Object.assign(body.$options, {
        skip: _params.skip,
      });
    }

    delete body["$paginate"];
  }
}

function fixBodyRecursive(body, keyName, isRoot = false) {
  const { $filters, $options, ...rest } = body;

  if ($filters) {
    body["$"] = body["$"] || {};
    body["$"].filters = $filters;
    body.$filters = null;
    delete body.$filters;
  }

  if ($options) {
    body["$"] = body["$"] || {};
    body["$"].options = $options;
    body.$options = null;
    delete body.$options;
  }

  if (!isRoot && body["$"]?.options?.limit) {
    console.warn(`${keyName}: Limit in a link will make the query slower, please avoid using it.`);
  }

  Object.entries(body).forEach(([key, value]) => {
    if (isObject(value)) {
      return fixBodyRecursive(value, key);
    }
  });
}

export default (collection, _body, _params = {}) => {
  const body = cloneDeep(_body);
  const params = cloneDeep(_params);

  applyPagination(body, params);
  applyFilterRecursive(body, params, true);
  applySoftDelete(collection, body, params);
  applySearch(collection, body, params);
  fixBodyRecursive(body, "root", true);

  return body;
};
