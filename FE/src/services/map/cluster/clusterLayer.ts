import map from "../map.ts";
import {groupFeaturesByColorAndMutualLocation} from "./groupFeaturesByColorAndMutualLocation.ts";
import {createColorBasedClusterSources} from "./cluster.ts";
import VectorLayer from "ol/layer/Vector";
import {Cluster} from "ol/source";
import {createClusterStyle} from "../style/clusterStyle.ts";
import {Feature} from "ol";
import {Geometry} from "ol/geom";
import areFeatureGroupsEqual from "./areFeatureGroupsEqual.ts";

let currentClusterLayers: VectorLayer<Cluster>[] = [];
let lastFeaturesByColor: { [color: string]: Feature<Geometry>[] } = {};
let lastFeatureCount = 0;
let updateTimeout: number | null = null;

export const setupClusterLayer = ({clusterSources}:{ clusterSources?: { [_p: string]: Cluster<Feature<Geometry>> } | undefined
}) => {
    if (!clusterSources) return currentClusterLayers = [];
    Object.entries(clusterSources).forEach(([color, clusterSource]) => {
        const clusterLayer = new VectorLayer<Cluster>({
            source: clusterSource,
            visible: true,
            zIndex: 1,
            style: createClusterStyle(color),
        });
        currentClusterLayers.push(clusterLayer);
    });
    return currentClusterLayers;
}

export const getCurrentClusterLayers = () => currentClusterLayers;

export const updateClusterLayerWithDebounce = () => {
    if (updateTimeout) {
        clearTimeout(updateTimeout);
    }

    updateTimeout = setTimeout(() => {
        performClusterUpdate();
    }, 50);
};

export const performClusterUpdate = () => {
    if (!map.sources) return;

    const {poiSource} = map.sources;
    const features = poiSource.getFeatures();

    if (features.length === 0) {
        if (currentClusterLayers.length > 0) {
            currentClusterLayers.forEach((layer: VectorLayer) => {
                map.ol.removeLayer(layer);
            });
            currentClusterLayers = [];
            lastFeaturesByColor = {};
            lastFeatureCount = 0;
        }
        return;
    }

    if (Math.abs(features.length - lastFeatureCount) < 5 && currentClusterLayers.length > 0) {
        return;
    }

    const featuresByColor = groupFeaturesByColorAndMutualLocation(features);

    if (areFeatureGroupsEqual(featuresByColor, lastFeaturesByColor)) return;

    lastFeaturesByColor = featuresByColor;
    lastFeatureCount = features.length;

    for (const layer of currentClusterLayers) {
        map.ol.removeLayer(layer);
    }

    const clusterSources = createColorBasedClusterSources(featuresByColor);

    currentClusterLayers = [];
    Object.entries(clusterSources).forEach(([color, clusterSource], index) => {
        const clusterLayer = new VectorLayer<Cluster>({
            source: clusterSource,
            visible: true,
            zIndex: 2 + index,
            style: createClusterStyle(color)
        });
        map.ol.addLayer(clusterLayer);
        currentClusterLayers.push(clusterLayer);
    });
};
