import * as z from 'zod';
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { ValidationError } from 'meteor/mdg:validation-error';


const writeMethods = ['insertAsync', 'updateAsync', 'upsertAsync'];

Object.assign(Mongo.Collection.prototype, {
  _schema: null,
  _withDates: false,
  _softDelete: false,
  withSchema(schema) {
    this._schema = schema;
    return this;
  },
  withDates() {
    this._withDates = true;
    this._schema = this._schema.extend({
      createdAt: z.date(),
      updatedAt: z.date(),
    });
  },
  withSoftDelete() {
    this._softDelete = true;
    this._schema = this._schema.extend({
      isDeleted: z.boolean().default(false),
      deletedAt: z.date().optional(),
    });
  }
});

Meteor.startup(() => {
  writeMethods.forEach(methodName => {
    const method = Mongo.Collection.prototype[methodName];

    Mongo.Collection.prototype[methodName] = function(...args) {
      const collection = this;
      const { _name, _schema, _withDates } = collection;

      // TODO: Support to bypass schema validation
      // autoCheck can also be skipped on a one-off basis per method call, so we check here if that's the case
      // if (!config.autoCheck) {
      //   const result = method.apply(collection, args);
      //   config.autoCheck = true;
      //   return result;
      // }

      if (!_schema) {
        return method.apply(collection, args);
      }

      const isUpdate = ['update', 'updateAsync'].includes(methodName);
      const isUpsert = ['upsert', 'upsertAsync'].includes(methodName) || (isUpdate && (args[2]?.hasOwnProperty('upsert') || false) && args[2]['upsert']);
      const isUserServicesUpdate = isUpdate && _name === 'users' && Object.keys(Object.values(args[1])[0])[0].split('.')[0] === 'services';

      // If you do have a Meteor.users schema, then this prevents a check on Meteor.users.services updates that run periodically to resume login tokens and other things that don't need validation
      if (isUserServicesUpdate) {
        return method.apply(collection, args);
      }

      if (_withDates) {
        // TODO: We need to test upsert
        if (isUpsert) {
          args[1]["$setOnInsert"] = args[1]["$set"] || {};
          args[1]["$setOnInsert"].createdAt = new Date();
          args[1]["$set"] = args[1]["$set"] || {};
          args[1]["$set"].updatedAt = new Date();
        } else if (isUpdate) {
          args[1]["$set"] = args[1]["$set"] || {};
          args[1]["$set"].createdAt = undefined;
          args[1]["$set"].updatedAt = new Date();
        } else {
          args[0].createdAt = new Date();
          args[0].updatedAt = new Date();
        }
      }

      const data = isUpsert ? { ...args[0], ...args[1] } : isUpdate ? args[1] : args[0];
      const schemaToCheck = isUpdate ? _schema.deepPartial() : _schema;

      try {
        // TODO: Support $unset, $currentDate, $rename and array update operators on update modifiers
        // TODO: Check if we really need strict and how we can pass data to method
        if (isUpdate) {
          Object.keys(args[1]).forEach((key) => {
            args[1][key] = schemaToCheck.parse(args[1][key]);
          });
        } else {
          args[0] = schemaToCheck.parse(data);
        }
      } catch (e) {
        throw new ValidationError(e.issues?.map((err) => {
          const { path = [], keys = [], code, ...rest } = err;
          const fullPath = [...path, ...keys].join(".");

          return {
            name: fullPath,
            type: code,
            ...rest,
            message: err.message,
          };
        }), "Collection schema validation error");
      }

      console.log(args);
      return method.apply(collection, args);
    }
  });
});

function getDataFromModifiers(modifiers) {
  const data = {};

  Object.keys(modifiers).forEach(key => {
    Object.assign(data, modifiers[key]);
  });

  return data;
}