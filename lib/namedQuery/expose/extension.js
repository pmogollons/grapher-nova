import isFunction from "lodash.isfunction";
import { check } from "meteor/check";
import { Meteor } from "meteor/meteor";
import { DDPRateLimiter } from "meteor/ddp-rate-limiter";

import mergeDeep from "./lib/mergeDeep.js";

import NamedQuery from "../namedQuery.js";
import MemoryResultCacher from "../cache/MemoryResultCacher";
import { ExposeSchema, ExposeDefaults } from "./schema.js";


Object.assign(NamedQuery.prototype, {
  /**
   * @param config
   */
  expose(config = {}) {
    if (!Meteor.isServer) {
      throw new Meteor.Error(
        "invalid-environment",
        "You must run this in server-side code",
      );
    }

    if (this.isExposed) {
      throw new Meteor.Error(
        "query-already-exposed",
        `You have already exposed: "${this.name}" named query`,
      );
    }

    this.exposeConfig = Object.assign({}, ExposeDefaults, config);
    check(this.exposeConfig, ExposeSchema);

    if (this.exposeConfig.validateParams) {
      this.options.validateParams = this.exposeConfig.validateParams;
    }

    if (this.exposeConfig.schema) {
      this.options.schema = this.exposeConfig.schema;
    }

    if (this.exposeConfig.cache) {
      this.options.cache = this.exposeConfig.cache;
    }

    if (!this.isResolver) {
      this._initNormalQuery();
    } else {
      this._initMethod();
    }

    this._setCache();
    this._setRateLimit();

    this.isExposed = true;
  },

  /**
   * Initializes a normal NamedQuery (normal == not a resolver)
   * @private
   */
  _initNormalQuery() {
    const config = this.exposeConfig;

    if (config.method) {
      this._initMethod();
      this._initCountMethod();
    }

    if (!config.method) {
      throw new Meteor.Error(
        "weird",
        "If you want to expose your named query you need to specify at least one of [\"method\"] options to true",
      );
    }
  },

  /**
   * Returns the embodied body of the request
   * @param {*} _embody
   * @param {*} body
   */
  doEmbodimentIfItApplies(body, params) {
    // query is not exposed yet, so it doesn't have embodiment logic
    if (!this.exposeConfig) {
      return;
    }

    const { embody } = this.exposeConfig;

    if (!embody) {
      return;
    }

    if (isFunction(embody)) {
      embody.call(this, body, params);
    } else {
      mergeDeep(body, embody);
    }
  },

  /**
   * @private
   */
  _initMethod() {
    const self = this;

    Meteor.methods({
      async [this.name](newParams) {
        self._unblockIfNecessary(this);

        // security is done in the fetching because we provide a context
        return await self.clone(newParams).fetchAsync(this);
      },
    });
  },

  /**
   * @returns {void}
   * @private
   */
  _initCountMethod() {
    const self = this;

    Meteor.methods({
      async [this.name + ".count"](newParams) {
        self._unblockIfNecessary(this);

        // security is done in the fetching because we provide a context
        return await self.clone(newParams).getCountAsync(this);
      },
    });
  },

  _setRateLimit() {
    const { rateLimit } = this.exposeConfig;

    if (rateLimit) {
      const self = this;

      const ruleId = DDPRateLimiter.addRule({
        name: (name) => [self.name, `${self.name}.count`].includes(name),
        connectionId: () => true,
      }, rateLimit.limit, rateLimit.time);

      if (rateLimit.message) {
        DDPRateLimiter.setErrorMessageOnRule(ruleId, rateLimit.message);
      }
    }
  },

  _setCache() {
    const { cache } = this.exposeConfig;

    if (cache) {
      const { ttl } = cache;

      this.cacher = new MemoryResultCacher({ ttl });

      if (this.collection.onInsert) {
        this.collection.onInsert(async (params) => {
          return await invalidateCaches(params, this.collection, "insert");
        });

        this.collection.onUpdate(async (params) => {
          return await invalidateCaches(params, this.collection, "update");
        });

        this.collection.onRemove(async (params) => {
          return await invalidateCaches(params, this.collection, "remove");
        });

        this.collection._cachedQueries = this.collection._cachedQueries || [];

        this.collection._cachedQueries.push({
          query: this,
          type: this.options.cache.type || "list",
        });
      }
    }
  },

  /**
   * @param context
   * @param userId
   * @param params
   * @private
   */
  async _callFirewall(context, userId, params) {
    const { firewall } = this.exposeConfig;

    if (!firewall) {
      return;
    }

    if (Array.isArray(firewall)) {
      await Promise.all(firewall.map(async (fire) => {
        await fire.call(context, userId, params);
      }));
    } else {
      await firewall.call(context, userId, params);
    }
  },

  /**
   * @param context
   * @private
   */
  _unblockIfNecessary(context) {
    if (this.exposeConfig.unblock) {
      if (context.unblock) {
        context.unblock();
      }
    }
  },
});

const invalidateCaches = async ({ doc }, collection, operation) => {
  await Promise.all(collection._cachedQueries.map(async (cachedQuery) => {
    // TODO: We need a way to set the filter to invalidate only the specific queries
    if (cachedQuery.type === "list") {
      await cachedQuery.query.invalidateAllQueries();
    } else if (operation !== "insert") {
      await cachedQuery.query.invalidateQueries({ _id: doc._id });
    }
  }));
};