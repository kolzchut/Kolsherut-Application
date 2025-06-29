import Style from "ol/style/Style";
import {Circle, Fill, Stroke} from "ol/style";
import {Response} from "../../../types/cardType";

export default (responses: Response[])=> {
    const poiColors = window.responseColors;
    let color: string = 'rgba(255, 0, 0, 1)';
    for (const response of responses) {
        if (response.id && poiColors[response.id]) {
            color = poiColors[response.id];
            break;
        }
    }
    return new Style({
        image: new Circle({
            radius: window.config.map.poi.radius,
            fill: new Fill({
                color: color
            }),
            stroke: new Stroke({
                color: color,
                width: 1
            })
        })
    });
}
