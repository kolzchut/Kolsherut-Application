import TileLayer from "ol/layer/Tile";
import {Geometry} from "ol/geom";
import {Feature} from "ol";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import {XYZ} from "ol/source";

export interface GetLayersParams {
    worldImagerySource: XYZ;
    poiSource: VectorSource<Feature<Geometry>>;
}

export type GetLayersReturn = [TileLayer<XYZ>, VectorLayer<VectorSource<Feature<Geometry>>>];
