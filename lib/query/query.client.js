import { Meteor } from "meteor/meteor";

import Base from "./query.base";


export default class Query extends Base {
  /**
   * Retrieves the data.
   * @returns {*}
   */
  async fetchAsync() {
    this.doValidateParams();

    return await this._fetchStatic();
  }

  /**
   * @returns {*}
   */
  async fetchOneAsync() {
    const data = await this.fetchAsync();
    const [firstElement] = data;

    return firstElement;
  }

  /**
   * Gets the count of matching elements.
   * @returns {any}
   */
  async getCountAsync() {
    return await Meteor.callAsync(
      this.name + ".count",
      { collectionName: this.collection.name, body: this.body, params: this.params },
    );
  }

  /**
   * Fetching queries
   * @private
   */
  async _fetchStatic() {
    return await Meteor.callAsync(this.name, { collectionName: this.collection.name, body: this.body, params: this.params });
  }
}
