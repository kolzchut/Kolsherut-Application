import Style from "ol/style/Style";
import {Circle, Fill, Stroke} from "ol/style";

export default new Style({
    image: new Circle({
        radius: 5,
        fill: new Fill({
            color: 'rgba(255, 0, 0, 0.5)'
        }),
        stroke: new Stroke({
            color: 'rgba(255, 0, 0, 1)',
            width: 1
        })
    })
});
