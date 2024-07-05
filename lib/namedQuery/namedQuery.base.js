import { check } from "meteor/check";
import { cloneDeep, isFunction } from "lodash";


let globalConfig = {};

export default class NamedQueryBase {
  static setConfig(config) {
    globalConfig = config;
  }

  static getConfig() {
    return globalConfig;
  }

  isNamedQuery = true;

  constructor(name, collection, body, options = {}) {
    this.queryName = name;

    if (isFunction(body)) {
      this.resolver = body;
    } else {
      this.body = cloneDeep(body);
    }

    this.params = options.params || {};
    this.options = Object.assign({}, globalConfig, options);
    this.collection = collection;
    this.isExposed = false;
  }

  get name() {
    return `named_query_${this.queryName}`;
  }

  get isResolver() {
    return !!this.resolver;
  }

  setParams(params) {
    this.params = Object.assign({}, this.params, params);

    return this;
  }

  /**
   * Validates the parameters
   */
  doValidateParams(params) {
    params = params || this.params;

    const { validateParams } = this.options;
    if (!validateParams) {
      return;
    }

    try {
      this._validate(validateParams, params);
    } catch (validationError) {
      console.error(`Invalid parameters supplied to the query "${this.queryName}"\n`, validationError);
      throw validationError; // rethrow
    }
  }

  clone(newParams) {
    const params = Object.assign({}, cloneDeep(this.params), newParams);

    const clone = new this.constructor(
      this.queryName,
      this.collection,
      this.isResolver ? this.resolver : cloneDeep(this.body),
      {
        ...this.options,
        params,
      }
    );

    clone.cacher = this.cacher;
    if (this.exposeConfig) {
      clone.exposeConfig = this.exposeConfig;
    }

    return clone;
  }

  /**
   * @param {function|object} validator
   * @param {object} params
   * @private
   */
  _validate(validator, params) {
    if (isFunction(validator)) {
      validator.call(null, params);
    } else {
      check(params, validator);
    }
  }
}

NamedQueryBase.defaultOptions = {};
