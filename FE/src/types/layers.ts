import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import {Geometry} from "ol/geom";
import {Feature} from "ol";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";

export interface GetLayersParams {
    osmSource: OSM;
    poiSource: VectorSource<Feature<Geometry>>;
}

export type GetLayersReturn = [TileLayer<OSM>, VectorLayer<VectorSource<Feature<Geometry>>>];
