/* global Package: true */
import "./aggregate";
import "./createQuery";
import "../namedQuery/expose/extension";


if (Package["aldeed:simple-schema"]) {
  import "./extendWithSoftDelete";
  import "./extendWithDates";
}

try {
  if (require("zod")) {
    import "./extendWithSchema";
  }
} catch (e) {
  console.log("zod package not found, skipping schema, dates and softDelete extensions");
}
