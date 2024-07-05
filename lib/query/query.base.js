import { check } from "meteor/check";
import { cloneDeep, isFunction } from "lodash";


export default class QueryBase {
  isGlobalQuery = true;

  constructor(collection, body, options = {}) {
    this.collection = collection;

    this.body = cloneDeep(body);

    this.params = options.params || {};
    this.options = options;
  }

  clone(newParams) {
    const params = Object.assign({}, cloneDeep(this.params), newParams);

    return new this.constructor(
      this.collection,
      cloneDeep(this.body),
      {
        params,
        ...this.options,
      }
    );
  }

  get name() {
    return `exposure_${this.collection._name}`;
  }

  /**
     * Validates the parameters
     */
  doValidateParams() {
    const { validateParams } = this.options;
    if (!validateParams) {
      return;
    }

    if (isFunction(validateParams)) {
      validateParams.call(null, this.params);
    } else {
      check(this.params);
    }
  }

  /**
     * Merges the params with previous params.
     *
     * @param params
     * @returns {Query}
     */
  setParams(params) {
    this.params = Object.assign({}, this.params, params);

    return this;
  }
}
