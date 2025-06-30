import Style from "ol/style/Style";
import {Circle, Fill, Stroke} from "ol/style";
import {Response} from "../../../types/cardType";
import getColorByResponses from "./getColorByResponses";

export default ({responses,accurateLocation}:{responses: Response[], accurateLocation: boolean})=> {
    const color = getColorByResponses(responses).background
    const semiColor = `${color}66`
    return new Style({
        image: new Circle({
            radius: window.config.map.poi.circleRadius,
            fill: new Fill({
                color: accurateLocation ? color : "#ffffffff"
            }),
            stroke: new Stroke({
                color: semiColor,
                width:  window.config.map.poi.strokeRadius,
            })
        })
    });
}
