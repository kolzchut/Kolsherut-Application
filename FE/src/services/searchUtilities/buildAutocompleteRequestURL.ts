const searchMacro = '%%search%%';

// The typed term must never reach the URL raw: it travels as a query-string value, so
// every reserved character has to be percent-encoded. The replacement is passed as a
// function on purpose - String.replace with a string replacement treats `$&`, `$'`,
// backtick-$ and `$1` as capture references, and encodeURIComponent leaves `$` untouched.
const buildAutocompleteRequestURL = (searchTerm: string): string => {
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    return window.config.routes.autocomplete.replace(searchMacro, () => encodedSearchTerm);
};

export default buildAutocompleteRequestURL;
