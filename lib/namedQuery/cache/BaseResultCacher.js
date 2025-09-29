import { EJSON } from "meteor/ejson";

/**
 * This is a very basic in-memory result caching functionality
 */
export default class BaseResultCacher {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * @param queryName
   * @param params
   * @returns {string}
   */
  static _generateQueryId(queryName, params) {
    return `${queryName}::${EJSON.stringify(params)}`;
  }

  /**
   * @param queryName
   * @param params
   * @returns {string}
   */
  generateQueryId(queryName, params = {}) {
    return `${queryName}::${EJSON.stringify(params)}`;
  }

  /**
   * Dummy function
   */
  fetchAsync(cacheId, { query, countCursor }) {
    console.log(query || countCursor);

    throw `${cacheId} not implemented`;
  }

  /**
   * @param query
   * @param countCursor
   * @returns {*}
   */
  static async fetchData({ query, countCursor }) {
    if (query) {
      return await query.fetchAsync();
    } else {
      return countCursor;
    }
  }
}
