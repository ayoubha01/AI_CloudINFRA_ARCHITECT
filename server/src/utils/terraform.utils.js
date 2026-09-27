export const sanitizeResourceName = (name) => {
  return name
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");
};