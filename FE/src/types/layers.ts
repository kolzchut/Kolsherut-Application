import TileLayer from "ol/layer/Tile";
import {Geometry} from "ol/geom";
import {Feature} from "ol";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import {XYZ} from "ol/source";
import {Cluster} from "ol/source";

export interface GetLayersParams {
    osm: XYZ;
    poiSource: VectorSource<Feature<Geometry>>;
    israelBorderSource: VectorSource<Feature<Geometry>>
    clusterSources?: { [color: string]: Cluster };
}

export type GetLayersReturn = [TileLayer<XYZ>, VectorLayer<VectorSource<Feature<Geometry>>>,VectorLayer<VectorSource<Feature<Geometry>>>, ...VectorLayer<Cluster>[]];
