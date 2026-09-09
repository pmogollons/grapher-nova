// Same export-assignment structure used by zodern:types / Meteor packages.d.ts.
declare module "meteor/mongo" {
  import exports = require("package-types/mongo");
  export = exports;
}

declare module "meteor/pmogollons:nova" {
  import exports = require("package-types/pmogollons_nova");
  export = exports;
}
