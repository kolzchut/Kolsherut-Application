import {Feature} from "ol";
import {Geometry} from "ol/geom";
import {GeoJSON} from "ol/format";

const processFeaturesToGeometryMap = (features: Feature<Geometry>[]): Map<string, Feature<Geometry>[]> => {
    const geometryMap = new Map<string, Feature<Geometry>[]>();

    features.forEach((feature) => {
        const geometry = feature.getGeometry();
        if (!geometry) return;
        const coordsKey = new GeoJSON().writeGeometry(geometry);
        const cardId = feature.getProperties()?.cardId;
        if (!geometryMap.has(coordsKey)) geometryMap.set(coordsKey, []);
        const existingFeatures = geometryMap.get(coordsKey)!;

        if (!cardId) return existingFeatures.push(feature);

        const existingIndex = existingFeatures.findIndex(f => f.getProperties()?.cardId === cardId);
        if (existingIndex === -1) return existingFeatures.push(feature);

        existingFeatures[existingIndex] = feature;
    });

    return geometryMap;
};

const categorizeFeaturesByGeometry = (geometryMap: Map<string, Feature<Geometry>[]>): {
    mutualFeatures: Array<{ features: Feature<Geometry>[], geometry: Geometry }>,
    remainingFeatures: Feature<Geometry>[]
} => {
    const mutualFeatures: Array<{ features: Feature<Geometry>[], geometry: Geometry }> = [];
    const remainingFeatures: Feature<Geometry>[] = [];

    Array.from(geometryMap.entries()).forEach(([_coordsKey, featureGroup]) => {
        if (featureGroup.length < 2) return remainingFeatures.push(...featureGroup);

        const geometry = featureGroup[0].getGeometry()!;
        mutualFeatures.push({features: featureGroup, geometry});
    });

    return {mutualFeatures, remainingFeatures};
};

export const getMutualGeometryFeatures = (features: Feature<Geometry>[]): {
    mutualFeatures: Array<{ features: Feature<Geometry>[], geometry: Geometry }>,
    remainingFeatures: Feature<Geometry>[]
} => {
    const geometryMap = processFeaturesToGeometryMap(features);
    return categorizeFeaturesByGeometry(geometryMap);
}
