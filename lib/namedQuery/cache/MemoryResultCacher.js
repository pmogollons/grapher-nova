import cloneDeep from "lodash.clonedeep";
import { Meteor } from "meteor/meteor";

import BaseResultCacher from "./BaseResultCacher";


const DEFAULT_TTL = 60000;

/**
 * This is a very basic in-memory result caching functionality
 */
export default class MemoryResultCacher extends BaseResultCacher {
  constructor(config = {}) {
    super(config);
    this.store = {};
  }

  /**
   * @param cacheId
   * @param query
   * @param countCursor
   * @returns {*}
   */
  async fetchAsync(cacheId, { query, countCursor }) {
    const cacheData = this.store[cacheId];

    if (cacheData !== undefined) {
      return cloneDeep(cacheData);
    }

    const data = await BaseResultCacher.fetchData({ query, countCursor });

    this.storeData(cacheId, data);

    return data;
  }


  /**
   * @param cacheId
   * @param data
   */
  storeData(cacheId, data) {
    const ttl = this.config.ttl || DEFAULT_TTL;
    this.store[cacheId] = cloneDeep(data);

    Meteor.setTimeout(() => {
      delete this.store[cacheId];
    }, ttl);
  }

  expire(cacheId) {
    delete this.store[cacheId];
  }

  // TODO: This can be improved by using a more efficient data structure
  expireAll(queryName) {
    Object.keys(this.store).forEach((cacheId) => {
      if (cacheId.includes(`${queryName}::`)) {
        this.expire(cacheId);
      }
    });
  }
}
