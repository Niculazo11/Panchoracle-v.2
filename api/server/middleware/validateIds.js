// Rejects malformed ObjectIds in route params with 400 before they reach Mongoose.
// Usage: router.get("/:id", validateIds("id"), handler)
import AppError from "../utils/AppError.js";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export function validateIds(...names) {
  return (req, res, next) => {
    for (let i = 0; i < names.length; i++) {
      if (!OBJECT_ID_REGEX.test(req.params[names[i]])) {
        throw new AppError(400, "VALIDATION_ERROR", `${names[i]} is not a valid id`);
      }
    }
    next();
  };
}
