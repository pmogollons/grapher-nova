import { query } from "@bluelibs/nova";

import Base from "./query.base";
import prepareForProcess from "./lib/prepareForProcess.js";


// TODO: Support to extend context
// TODO: Support for transactions
export default class Query extends Base {
  /**
   * Retrieves the data.
   * @param context
   * @returns {*}
   */
  async fetchAsync(context = {}) {
    // TODO: Check this because the context with limit one will override other options
    const body = prepareForProcess(this.collection, { ...this.body, ...context }, this.params);

    return await query(
      this.collection.raw,
      body,
      { ...context }
      // eslint-disable-next-line custom-rules/async-only
    ).fetch();
  }

  /**
   * @param context
   * @returns {*}
   */
  async fetchOneAsync(context = {}) {
    context.$options = context.$options || {};
    context.$options.limit = 1;

    const data = await this.fetchAsync(context);
    const [firstElement] = data;

    return firstElement;
  }

  /**
   * Gets the count of matching elements.
   * @returns {integer}
   */
  async getCountAsync() {
    const filters = this.body.$filters || {};

    if (filters.$search) {
      const { $search, ...$match } = filters;

      const stages = [
        { $search },
        { $match: { ...$match } },
        { $group: { _id: null, countAsync: { $sum: 1 } } },
      ];

      if (Object.keys($match).length === 0) {
        stages.splice(1, 1);
      }

      return this.collection.aggregate(stages)[0].countAsync;
    }

    return await this.collection.find(filters, {}).countAsync();
  }
}
