import SimpleSchema from "simpl-schema";
import { Mongo } from "meteor/mongo";


Object.assign(Mongo.Collection.prototype, {
  attachDatesSchema() {
    this.attachSchema(new SimpleSchema({
      createdAt: {
        type: Date,
        autoValue() {
          if (this.isInsert) {
            return new Date();
          } else if (this.isUpsert) {
            return { $setOnInsert: new Date() };
          }

          this.unset();
        },
      },
      updatedAt: {
        type: Date,
        autoValue() {
          return new Date();
        },
      },
    }));
  },
});
