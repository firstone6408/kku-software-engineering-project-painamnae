const ApiError = require("../utils/ApiError");

// const zodValidate = (schema, data) => {
//   const parsed = schema.safeParse(data);
//   if (!parsed.success) {
//     const messages = parsed.error.errors
//       .map((i) => `${i.path.join(".")} - ${i.message}`)
//       .join(", ");
//     throw new ApiError(400, `Validation error: ${messages}`);
//   }

//   return parsed.data;
// };

const zodValidateThrow = (parsed) => {
  const messages = parsed.error.errors
    .map((i) => `${i.path.join(".")} - ${i.message}`)
    .join(", ");
  throw new ApiError(400, `Validation error: ${messages}`);
};

module.exports = { zodValidateThrow };
