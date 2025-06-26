export const removeMacro = ({stringWithMacro, macro, replacement}: {stringWithMacro: string, macro: string, replacement: string}): string => {
    if (!stringWithMacro || !macro || !replacement) return stringWithMacro;
    return stringWithMacro.replace(macro, replacement);
}
