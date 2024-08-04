/* global Package: true */
import "./aggregate";
import "./createQuery";
import "../namedQuery/expose/extension";


if (Package["aldeed:simple-schema"]) {
  require("./extendWithSoftDelete");
  require("./extendWithDates");
} else {
  try {
    if (require("zod")) {
      require("./extendWithSchema");
      require("./extendWithSoftDelete");
    }
  } catch (e) {
    console.log("zod package not found, skipping schema, dates and softDelete extensions");
  }
}
