export default function convertFiltersToCompound(filters) {
  const filter = [];
  const mustNot = [];

  // TODO: must, mustNot are like $and, should is like $or
  Object.keys(filters).forEach(key => {
    if (typeof filters[key] === "string") {
      filter.push({
        equals: {
          value: filters[key],
          path: key,
        },
      });

      delete filters[key];
    } else if (typeof filters[key] === "boolean" || typeof filters[key] === "number"
      || typeof filters[key] instanceof Date) {
      // TODO: Handle null https://www.mongodb.com/docs/atlas/atlas-search/tutorial/null-check/
      filter.push({
        equals: {
          value: filters[key],
          path: key,
        },
      });

      delete filters[key];
    } else if (typeof filters[key] === "object" && (filters[key].$gte || filters[key].$lte || filters[key].$lt || filters[key].$gt)) {
      const range = {};

      if (filters[key].$gt) {
        range.gt = filters[key].$gt;
      }

      if (filters[key].$gte) {
        range.gte = filters[key].$gte;
      }

      if (filters[key].$lt) {
        range.lt = filters[key].$lt;
      }

      if (filters[key].$lte) {
        range.lte = filters[key].$lte;
      }

      filter.push({
        range: {
          path: key,
          ...range,
        },
      });

      delete filters[key];
    } else if (typeof filters[key] === "object" && filters[key].$in) {
      filter.push({
        in: {
          path: key,
          value: filters[key].$in,
        },
      });

      delete filters[key];
    } else if (typeof filters[key] === "object" && typeof filters[key].$exists === "boolean") {
      if (filters[key].$exists) {
        filter.push({
          exists: {
            path: key,
          },
        });
      } else {
        mustNot.push({
          exists: {
            path: key,
          },
        });
      }

      delete filters[key];
    } else if (typeof filters[key] === "object" && filters[key].$ne) {
      // TODO: null, timestamp
      if (typeof filters[key].$ne === "string") {
        mustNot.push({
          equals: {
            value: filters[key].$ne,
            path: key,
          },
        });
      } else if (typeof filters[key].$ne === "boolean" || typeof filters[key].$ne === "number"
        || typeof filters[key].$ne instanceof Date) {
        mustNot.push({
          equals: {
            value: filters[key].$ne,
            path: key,
          },
        });
      }

      delete filters[key];
    } else if (typeof filters[key] === "object" && filters[key].$nin) {
      mustNot.push({
        in: {
          path: key,
          value: filters[key].$nin,
        },
      });

      delete filters[key];
    } else if (typeof filters[key] === "object" && filters[key].$eq) {
      // TODO: null, timestamp
      if (typeof filters[key].$ne === "string") {
        filter.push({
          equals: {
            value: filters[key].$ne,
            path: key,
          },
        });
      } else if (typeof filters[key].$ne === "boolean" || typeof filters[key].$ne === "number"
        || typeof filters[key].$ne instanceof Date) {
        filter.push({
          equals: {
            value: filters[key].$ne,
            path: key,
          },
        });
      }

      delete filters[key];
    }
  });

  return { filter, mustNot };
}
