import { Mongo } from 'meteor/mongo';


if (!Mongo.Collection.prototype.aggregate) {
  Mongo.Collection.prototype.aggregate = async function (pipelines, options) {
    return this.rawCollection().aggregate(pipelines, options).toArray();
  };
}