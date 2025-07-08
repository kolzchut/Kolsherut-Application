export const removeMacro = ({stringWithMacro, macro, replacement}: {
    stringWithMacro: string,
    macro: string,
    replacement: string
}): string => {
    if (!stringWithMacro || !macro || !replacement) return stringWithMacro;
    return stringWithMacro.replace(macro, replacement);
}

export const getHref = (occasion: string, hrefWithMacro: string): string => {
    const macro = window.config.redirects.macro
    return removeMacro({stringWithMacro: hrefWithMacro, macro, replacement: occasion})
}

export const getLinkToCard = (cardId: string) => {
    const macro = window.config.redirects.macro;
    return window.config.redirects.linkToCard.replace(macro, cardId);
}
export const checkIfAllFirstArrayValuesExistsInSecondArrayValues = ({mustBe, data}:{mustBe: string[], data: string[]}): boolean => {
    const setData = new Set(data);
    return mustBe.every(value => setData.has(value))
}
