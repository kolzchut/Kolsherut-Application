import {Response} from "../../../types/cardType";

export default (responses: Response[]): { background: string, font: string } => {
    const poiColors = window.responseColors.responses;
    let color = {background: '#ff0000', font: '#000000'};
    if (!responses || !Array.isArray(responses) || responses.length === 0) return color;
    for (const response of responses) {
        const categories = response.id.split(':').reverse();
        let breakable = false;
        for (const category of categories) {
            if (category && poiColors[category]) {
                const colorName = poiColors[category];
                color = window.responseColors.colors[colorName] || color;
                breakable = true;
                break;
            }
        }
        if (breakable) break;
    }
    return color;
}
