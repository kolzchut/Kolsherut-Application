import sanitizer from "../middlewares/sanitizer";
import fieldsToSanitize from "../assets/fieldsToReplace.json";

export const sanitizeCardRoute = sanitizer(fieldsToSanitize);
