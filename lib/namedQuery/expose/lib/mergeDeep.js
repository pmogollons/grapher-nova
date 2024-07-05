import { isObject, isFunction } from "lodash";


/**
 * Deep merge two objects.
 * @param target
 * @param source
 */
export default function mergeDeep(target, source) {
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isFunction(source[key])) {
        target[key] = source[key];
      } else if (isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, { [key]: {} });
        }

        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    });
  }

  return target;
}
