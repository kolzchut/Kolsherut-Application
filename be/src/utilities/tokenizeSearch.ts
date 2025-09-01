export type TokenizeResult = {
  trimmed: string;
  hasSearch: boolean;
  tokens: string[];
  termsArray: string[];
};

export const tokenizeSearch = (search: string): TokenizeResult => {
  const trimmed = (search || "").trim();
  const hasSearch = !!trimmed;
  const tokens = hasSearch ? Array.from(new Set(trimmed.split(/\s+/g).filter(Boolean))) : [];
  const termsArray = tokens.length ? Array.from(new Set([...tokens, trimmed])) : [];
  return { trimmed, hasSearch, tokens, termsArray };
};
