export function formatMongoDoc(doc: any) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  const formatted = {
    ...obj,
    _key: obj._id ? obj._id.toString() : obj._key,
    id: obj._id ? obj._id.toString() : obj.id,
  };
  return formatted;
}
