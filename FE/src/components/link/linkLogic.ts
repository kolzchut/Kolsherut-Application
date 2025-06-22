import {removeMacro} from "../../services/str";


export const getHref = (occasion: string, hrefWithMacro:string): string => {
    const macro = window.config.redirects.macro
    return removeMacro({stringWithMacro: hrefWithMacro, macro, replacement: occasion})
}