import {Response} from "../../../types/cardType";

export default (responses: Response[]): {background:string, font:string} => {
    const poiColors = window.responseColors.responses;
    let color = {background: '#ffffff', font: '#000000'};
    for (const response of responses) {
        if (response.id && poiColors[response.id]) {
            const colorName = poiColors[response.id];
            color = window.responseColors.colors[colorName] || color;
            break;
        }
    }
    return color;
}