import View from "ol/View";
import {fromLonLat} from "ol/proj";
import map from "./map";
import {toRadians} from "ol/math";
import {isMobileScreen} from "../media";

const view = new View({
    minZoom: isMobileScreen() ? 7.5 : 8,
});

export const setViewPort = ({center=window.config.map.center,zoom = window.config.map.zoom,rotation = window.config.map.rotation}:{center?: [number, number], zoom?: number, rotation?: number}) => {
    view.setCenter(fromLonLat(center));
    view.setZoom(zoom);
    view.setRotation(rotation);
};
export const goToXy = (xy: [number, number])=> {
    view.setCenter(fromLonLat(xy))
};
export const rotateMap=(azimuth = 0) =>view.setRotation(toRadians(azimuth));
export const increaseZoom = (by= 1) => {
    map.view.setZoom((map.view.getZoom()|| 0) + by);
}
export const decreaseZoom = (by = 1) => {
    map.view.setZoom((map.view.getZoom()|| 0) - by);
}
export const setZoom = (zoom: number) => {
    map.view.setZoom(zoom);
}



export default view;
