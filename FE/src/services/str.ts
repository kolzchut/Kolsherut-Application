export const removeMacro = ({stringWithMacro, macro, replacement}: {
    stringWithMacro: string,
    macro: string,
    replacement: string
}): string => {
    if (!stringWithMacro || !macro || !replacement) return stringWithMacro;
    return stringWithMacro.replace(macro, replacement);
}

export const replaceMacros = ({stringWithMacros, macrosAndReplacements}: {stringWithMacros: string, macrosAndReplacements:{[key:string]: string}}): string => {
    if (!stringWithMacros || !macrosAndReplacements) return stringWithMacros;
    let result = stringWithMacros;
    Object.entries(macrosAndReplacements).forEach(([macro, replacement]) => {
        result = result.replace(macro, replacement);
    });
    return result;
}

export const checkIfAllFirstArrayValuesExistsInSecondArrayValues = ({mustBe, data}:{mustBe: string[], data: string[]}): boolean => {
    const setData = new Set(data);
    return mustBe.every(value => setData.has(value))
}

export const checkIfAnyFirstArrayValueExistsInSecondArrayValues = ({options, data}: {options: string[], data: string[]}): boolean => {
    const setData = new Set(data);
    const filteredOptions = options.filter(value => value !== 'human_services');
    return filteredOptions.some(value => setData.has(value));
}


