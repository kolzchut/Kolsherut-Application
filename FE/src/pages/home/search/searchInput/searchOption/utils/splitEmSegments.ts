export interface EmSegment {
    text: string;
    isEm: boolean;
}

// Split a string containing <em>...</em> into segments marking which parts are inside <em>.
// All tags other than <em> are stripped. React-safe (render as text nodes).
export default function splitEmSegments(input: string): EmSegment[] {
    if (!input) return [];

    const OPEN = "__EM_OPEN__";
    const CLOSE = "__EM_CLOSE__";

    // Mark <em> boundaries, drop all other tags (attributes removed)
    const s = input
        .replace(/<\s*em\b[^>]*>/gi, OPEN)
        .replace(/<\s*\/\s*em\s*>/gi, CLOSE)
        .replace(/<[^>]*>/g, "");

    // If there are no markers, return one outside segment
    if (s.indexOf(OPEN) === -1 && s.indexOf(CLOSE) === -1) {
        return s ? [{ text: s, isEm: false }] : [];
    }

    const segments: EmSegment[] = [];
    let rest = s;

    while (rest.length) {
        const openIdx = rest.indexOf(OPEN);
        if (openIdx === -1) {
            const outside = rest;
            if (outside) segments.push({ text: outside, isEm: false });
            break;
        }
        const outside = rest.slice(0, openIdx);
        if (outside) segments.push({ text: outside, isEm: false });
        rest = rest.slice(openIdx + OPEN.length);

        const closeIdx = rest.indexOf(CLOSE);
        if (closeIdx === -1) {
            const inside = rest;
            if (inside) segments.push({ text: inside, isEm: true });
            break;
        }
        const inside = rest.slice(0, closeIdx);
        if (inside) segments.push({ text: inside, isEm: true });
        rest = rest.slice(closeIdx + CLOSE.length);
    }

    return segments;
}
