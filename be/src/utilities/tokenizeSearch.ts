export type TokenizeResult = {
  trimmed: string;
  hasSearch: boolean;
  tokens: string[];
  termsArray: string[];
};

export const tokenizeSearch = (search: string): TokenizeResult => {
  // Standardizes the search string: handles null/undefined, replaces underscores with spaces, squashes multiple spaces, and trims edges.
  const trimmed = (search || "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
  const hasSearch = !!trimmed;
  const tokens = hasSearch ? Array.from(new Set(trimmed.split(/\s+/g).filter(Boolean))) : [];
  const termsArray = tokens.length ? Array.from(new Set([...tokens, trimmed])) : [];
  return { trimmed, hasSearch, tokens, termsArray };
};
