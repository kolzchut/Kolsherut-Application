export const splitPhoneNumbers = (numbers: string[]): string[] => {
    if (!numbers) return [];
    const split = numbers.flatMap((number) => number.split(/[\s,]+/)).map((number) => number.trim()).filter(Boolean);
    return Array.from(new Set(split));
}
