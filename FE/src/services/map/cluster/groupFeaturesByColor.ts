import {Feature} from "ol";
import {Geometry} from "ol/geom";

const DEFAULT_COLOR = '#3399CC';

export const groupFeaturesByColor = (features: Feature<Geometry>[]): { [color: string]: Feature<Geometry>[] } => {
    return features.reduce((acc, feature) => {
        const color = feature.get('color') || DEFAULT_COLOR;
        acc[color] = acc[color] || [];
        acc[color].push(feature);
        return acc;
    }, {} as { [color: string]: Feature<Geometry>[] });
};
