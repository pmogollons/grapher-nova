import cloneDeep from "lodash.clonedeep";
import { Meteor } from "meteor/meteor";

import Base from "./namedQuery.base";
import intersectDeep from "../query/lib/intersectDeep";
import prepareForProcess from "../query/lib/prepareForProcess";
import MemoryResultCacher from "./cache/MemoryResultCacher";


export default class extends Base {
  /**
   * Retrieves the data.
   * @returns {*}
   */
  async fetchAsync(context) {
    await this._performSecurityChecks(context, this.params);

    if (this.isResolver) {
      return await this._fetchResolverData(context);
    } else {
      let body = cloneDeep(this.body);

      if (this.params.$body) {
        body = intersectDeep(body, this.params.$body);
      }

      // we must apply embodiment here
      this.doEmbodimentIfItApplies(body, this.params);

      const query = this.collection.createQuery(
        cloneDeep(body),
        { params: cloneDeep(this.params) },
      );

      if (this.cacher) {
        const cacheId = this.cacher.generateQueryId(this.queryName, this.params);
        return await this.cacher.fetchAsync(cacheId, { query });
      }

      return await query.fetchAsync();
    }
  }

  /**
   * @param args
   * @returns {*}
   */
  async fetchOneAsync(...args) {
    const data = await this.fetchAsync(...args);
    const [firstElement] = data;

    return firstElement;
  }

  /**
   * Gets the count of matching elements.
   *
   * @returns {any}
   */
  async getCountAsync(context) {
    await this._performSecurityChecks(context, this.params);

    const countCursor = this.getCursorForCounting();

    if (this.cacher) {
      const cacheId = "count::" + this.cacher.generateQueryId(this.queryName, this.params);

      return this.cacher.fetchAsync(cacheId, { countCursor });
    }

    return Array.isArray(countCursor) ? countCursor[0].countAsync : await countCursor.countAsync();
  }

  /**
   * Returns the cursor for counting
   * This is most likely used for counts cursor
   */
  getCursorForCounting() {
    let body = cloneDeep(this.body);
    this.doEmbodimentIfItApplies(body, this.params);
    body = prepareForProcess(this.collection, body, this.params);

    if (body.$?.filters?.$search) {
      const { $search, ...$match } = body.$.filters;

      return this.collection.aggregate([
        { $search },
        { $match },
        { $group: { _id: null, countAsync: { $sum: 1 } } },
      ]);
    }

    return this.collection.find(body.$?.filters || {}, { fields: { _id: 1 } });
  }

  /**
   * Expires the cache results for this query
   */
  invalidateQueries(params) {
    if (this.cacher) {
      const cacheId = this.cacher.generateQueryId(this.queryName, params || this.params);
      this.cacher.expire(cacheId);
    }
  }

  /**
   * Expires the cache results for all references of this query
   */
  invalidateAllQueries() {
    if (this.cacher) {
      this.cacher.expireAll(this.queryName);
    }
  }

  /**
   * Configure resolve. This doesn't actually call the resolver, it just sets it
   * @param fn
   */
  cacheResults(cacher) {
    if (!cacher) {
      cacher = new MemoryResultCacher({
        ttl: 1000 * 60 * 5,
      });
    }

    this.cacher = cacher;
  }

  /**
   * Configure resolve. This doesn't actually call the resolver, it just sets it
   * @param fn
   */
  resolve(fn) {
    if (!this.isResolver) {
      throw new Meteor.Error("invalid-call", "You cannot use resolve() on a non resolver NamedQuery");
    }

    this.resolver = fn;
  }

  /**
   * @returns {*}
   * @private
   */
  async _fetchResolverData(context) {
    const resolver = this.resolver;
    const self = this;
    const query = {
      async fetchAsync() {
        return await resolver.call(context, self.params);
      },
    };

    if (this.cacher) {
      const cacheId = this.cacher.generateQueryId(this.queryName, this.params);

      return await this.cacher.fetchAsync(cacheId, { query });
    }

    return query.fetchAsync();
  }

  /**
   * @param context Meteor method/publish context
   * @param params
   *
   * @private
   */
  async _performSecurityChecks(context, params) {
    if (context && this.exposeConfig) {
      await this._callFirewall(context, context.userId, params);
    }

    this.doValidateParams(params);
  }
}
