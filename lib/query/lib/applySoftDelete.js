export default function applySoftDelete(collection, body, params) {
  if (!body.$filters) {
    body.$filters = {};
  }

  if (collection._softDelete && body.$filters.isDeleted === undefined) {
    Object.assign(body.$filters, {
      isDeleted: false,
    });
  }
}
