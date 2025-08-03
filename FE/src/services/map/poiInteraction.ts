import map from "./map";
import {Feature} from "ol";
import {Point} from "ol/geom";
import {fromLonLat} from "ol/proj";
import PoiData from "../../types/poiData";
import dynamicBranchStyle from "./style/dynamicBranchStyle";
import getColorByResponses from "./style/getColorByResponses";

const getPOISource = () => {
    const layers = map.layers;
    if (!layers || layers.length < 2) return null;
    return layers[1].getSource();
}

export const removeAllPOIs = () => {
    const source = getPOISource();
    if (!source) return;
    source.clear();
}

export const addPOI = (poiData: PoiData) => {
    const source = getPOISource();
    if (!source) return;

    const colorInfo = getColorByResponses(poiData.responses);

    const f = new Feature({
        ...poiData,
        geometry: new Point(fromLonLat(poiData.branch_geometry)),
        featureType: "poi",
        color: colorInfo.background,
    });
    f.setStyle(dynamicBranchStyle({responses:poiData.responses, accurateLocation: poiData.accurateLocation}));
    source.addFeature(f);
};
