import SimpleSchema from "simpl-schema";
import { Mongo } from "meteor/mongo";
import { Meteor } from "meteor/meteor";


function extendWithSoftDelete() {
  const proto = Mongo.Collection.prototype;
  const removeAsync = proto.removeAsync;

  Object.assign(proto, {
    attachSoftDelete() {
      this._softDelete = true;

      this.attachSchema(new SimpleSchema({
        isDeleted: {
          type: Boolean,
          defaultValue: false,
        },
        deletedAt: {
          type: Date,
          optional: true,
        },
      }));
    },
    async removeAsync(params) {
      if (this._softDelete) {
        return await this.updateAsync(params, {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });
      }

      return await removeAsync.call(this, params);
    },
    async recoverAsync(params) {
      if (!this._softDelete) {
        throw new Meteor.Error(
          "SOFT_DELETE_DISABLED",
          "Soft delete is not enabled for this collection.");
      }

      return await this.updateAsync(params, {
        $unset: {
          deletedAt: true,
        },
        $set: {
          isDeleted: false,
        },
      });
    },
  });
}

extendWithSoftDelete();
