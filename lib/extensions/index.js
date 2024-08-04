/* global Package: true */
import "./aggregate";
import "./createQuery";
import "../namedQuery/expose/extension";


if (Package["aldeed:simple-schema"]) {
  require("./extendWithDates");
  require("./extendWithSoftDelete");
}