import {Feature} from "ol";
import {Geometry} from "ol/geom";
import {getMutualGeometryFeatures} from "./featureUtils";

const getDefaultColor = (): string => {
    return window.config?.clusterDefaultColor || '#3399CC';
};

export const groupFeaturesByColorAndMutualLocation = (features: Feature<Geometry>[]): { [color: string]: Feature<Geometry>[] } => {
    const separatedFeatures = getMutualGeometryFeatures(features);

    const coloredFeatures = separatedFeatures.remainingFeatures.reduce((acc, feature) => {
        const color = feature.get('color') || getDefaultColor();
        acc[color] = acc[color] || [];
        acc[color].push(feature);
        return acc;
    }, {} as { [color: string]: Feature<Geometry>[] });

    separatedFeatures.mutualFeatures.forEach((groupByLocation) => {
        const color = groupByLocation.features[0].get('color') || getDefaultColor();
        coloredFeatures[color] = coloredFeatures[color] || [];
        coloredFeatures[color].push(...groupByLocation.features);
    });

    return coloredFeatures;
};
