import {Feature} from "ol";
import {Geometry} from "ol/geom";
import map from "../../../services/map/map";
import VectorLayer from "ol/layer/Vector";
import {Cluster} from "ol/source";
import logger from "../../../services/logger/logger";
import {getCurrentClusterLayers} from "../../../services/map/cluster/clusterLayer.ts";

const getClusterLayers = (): VectorLayer<Cluster>[] => {
    if (!map.ol) return [];
    const layers = getCurrentClusterLayers();
    if (layers && layers.length) return layers;
    const layersArray = map.ol.getLayers().getArray() as VectorLayer<Cluster>[];
    return layersArray.filter((layer) => {
        const source = layer.getSource();
        return source instanceof Cluster;
    });
};

const findFeatureInLayer = (layer: VectorLayer<Cluster>, featureId: string): Feature<Geometry> | null => {
    const source = layer.getSource();
    if (!source) return null;
    const features = source.getFeatures();
    return features.find(f =>
        f.getId() === featureId ||
        f.getProperties().cardId === featureId
    ) || null;
};

const getFeatureById = (featureId: string) => {
    if (!map.layers) return logger.warning({message: "No map layers available"});

    const clusterLayers = getClusterLayers();
    if (clusterLayers.length === 0) return logger.warning({message: "No cluster layers found"});
    for (const layer of clusterLayers) {
        const foundFeature = findFeatureInLayer(layer, featureId);
        if (foundFeature) return foundFeature;
    }

    logger.warning({
        message: "Feature not found in any cluster layer",
        payload: {featureId}
    });
    return;
};

const findFeatureByIdentifier = (featureId: string): Feature<Geometry> | void => {
    if (!featureId) return;
    return getFeatureById(featureId);
};

export default findFeatureByIdentifier;
