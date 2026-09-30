export const removeNullValues = (value) => {

  if (Array.isArray(value)) {
    return value.map(removeNullValues);
  }

  if (
    value !== null &&
    typeof value === "object"
  ) {

    return Object.fromEntries(
      Object.entries(value)
        .filter(([, propertyValue]) =>
          propertyValue !== null
        )
        .map(([key, propertyValue]) => [
          key,
          removeNullValues(propertyValue)
        ])
    );
  }

  return value;
};