import {Request} from "express";

// The term arrives as a query-string value. A repeated `?search=` makes Express hand back
// an array, so only a plain string is accepted. `req.params.search` covers the legacy
// path-segment route and can be dropped together with it.
const resolveAutocompleteSearchTerm = (req: Request): string => {
    const searchFromQuery = req.query.search;
    if (typeof searchFromQuery === 'string') return searchFromQuery.trim();
    return (req.params.search || '').trim();
};

export default resolveAutocompleteSearchTerm;
