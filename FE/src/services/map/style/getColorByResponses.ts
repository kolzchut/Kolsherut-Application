import {Response} from "../../../types/cardType";

export default (responses: Response[]): string => {
    const poiColors = window.responseColors;
    let color: string = 'rgba(255, 0, 0, 1)';
    for (const response of responses) {
        if (response.id && poiColors[response.id]) {
            color = poiColors[response.id];
            break;
        }
    }
    return color;
}