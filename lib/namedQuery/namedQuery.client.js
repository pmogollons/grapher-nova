import { Meteor } from "meteor/meteor";

import Base from "./namedQuery.base";

export default class extends Base {
  /**
   * Retrieves the data.
   * @returns {*}
   */
  async fetchAsync() {
    return await this._fetchStatic();
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
   * Gets the count of matching elements in sync.
   * @returns {any}
   */
  async getCountAsync() {
    return Meteor.callAsync(this.name + ".count", this.params);
  }

  /**
   * Fetching non-reactive queries
   * @private
   * @returns {any}
   */
  async _fetchStatic() {
    return await Meteor.callAsync(this.name, this.params);
  }
}
