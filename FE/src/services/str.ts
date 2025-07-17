export const removeMacro = ({stringWithMacro, macro, replacement}: {
    stringWithMacro: string,
    macro: string,
    replacement: string
}): string => {
    if (!stringWithMacro || !macro || !replacement) return stringWithMacro;
    return stringWithMacro.replace(macro, replacement);
}

export const checkIfAllFirstArrayValuesExistsInSecondArrayValues = ({mustBe, data}: {
    mustBe: string[],
    data: string[]
}): boolean => {
    const setData = new Set(data);
    return mustBe.every(value => setData.has(value))
}
