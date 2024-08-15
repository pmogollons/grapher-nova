Package.describe({
  name: "pmogollons:nova",
  version: "1.0.0",
  summary: "Grapher-like query layer on top of nova and meteor",
  git: "https://github.com/pmogollons/grapher-nova",
  documentation: "README.md",
});

const npmPackages = {
  "mongodb": "4.17.0",
  "@bluelibs/nova": "1.6.0",
  "lodash.isobject": "3.0.2",
  "lodash.isfunction": "3.0.9",
  "lodash.clonedeep": "4.5.0",
  "lodash.pick": "4.4.0",
};

Package.onUse(function (api) {
  Npm.depends(npmPackages);

  api.versionsFrom(["3.0"]);

  const packages = [
    "typescript",
    "ecmascript",
    "check",
    "mongo",
    "zodern:types@1.0.13",
    "ddp-rate-limiter",
  ];

  api.use(packages);

  api.mainModule("main.client.js", "client");
  api.mainModule("main.server.js", "server");
});

Package.onTest(function (api) {
  api.use("pmogollons:nova");

  Npm.depends({
    ...npmPackages,
    chai: "4.3.4",
  });

  api.use([
    "random",
    "ecmascript",
    "typescript",
    "mongo",
    "tracker",
  ]);

  api.use(["meteortesting:mocha"]);
});
