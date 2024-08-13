import { query } from "@bluelibs/nova";
import { Meteor } from "meteor/meteor";

import Base from "./query.base";
import prepareForProcess from "./lib/prepareForProcess.js";


export default class Query extends Base {
  /**
   * Retrieves the data.
   * @param context
   * @returns {*}
   */
  async fetchAsync(context = {}) {
    const { $options, ...rest } = context;
    const options = Object.assign({}, this.body.$options, $options);
    const body = prepareForProcess(this.collection, { ...this.body, $options: options }, this.params);
    let userId;

    try {
      userId = Meteor.userId();
    } catch {
      // Do nothing
    }

    return await query(
      this.collection.raw,
      body,
      { userId, ...rest },
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
