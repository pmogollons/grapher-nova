import pick from "lodash.pick";
import isObject from "lodash.isobject";


const EXTENDED_SPECIAL_FIELDS = [
  "$search",
  "$filters",
  "$options",
  "$postFilters",
  "$postOptions",
  "$postFilter",
  "$filter",
  "$paginate",
  "$search",
];

function isClientValueValid(value) {
  if (isObject(value) && !Array.isArray(value)) {
    return Object.values(value).every(nestedValue => isClientValueValid(nestedValue));
  } else if (value === 1) {
    return true;
  }

  return false;
}

/**
 *
 * Recursive function which intersects the fields of the body objects.
 *
 * @param {object} allowed allowed body object - intersection can only be a subset of it
 * @param {object} client client body - can shrink main body, but not expand
 */
function intersectFields(allowed, client) {
  const intersection = {};

  Object.entries(client).forEach(([field, clientValue]) => {
    if (EXTENDED_SPECIAL_FIELDS.includes(field)) {
      return;
    }

    const serverValue = allowed[field];

    if (serverValue === 1) { // server allows everything
      if (isClientValueValid(clientValue)) {
        intersection[field] = clientValue;
      }
    } else if (isObject(serverValue)) {
      if (isObject(clientValue) && !Array.isArray(clientValue)) {
        intersection[field] = intersectFields(serverValue, clientValue);
      } else if (clientValue === 1) {
        // if client wants everything, serverValue is more restrictive here
        intersection[field] = serverValue;
      }
    }
  });

  return intersection;
}

/**
 * Given a named query that has a specific body, you can query its subbody
 * This performs an intersection of the bodies allowed in each
 *
 * @param allowedBody
 * @param clientBody
 */
export default function (allowedBody, clientBody) {
  const build = intersectFields(allowedBody, clientBody);

  // Add back special fields to the new body
  Object.assign(build, pick(allowedBody, EXTENDED_SPECIAL_FIELDS));

  return build;
}
