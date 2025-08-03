import Style from "ol/style/Style";
import {Circle, Fill, Stroke, Text} from "ol/style";
import {FeatureLike} from "ol/Feature";
import dynamicBranchStyle from "./dynamicBranchStyle";

const styleCache: {[key: string]: Style} = {};

const getSinglePOIStyle = (feature: FeatureLike) => {
    const originalFeature = feature.get('features')[0];
    const responses = originalFeature.get('responses') || [];
    const accurateLocation = originalFeature.get('accurateLocation') || originalFeature.get('branch_location_accurate') || false;

    return dynamicBranchStyle({ responses, accurateLocation });
};

export const createClusterStyle = (color: string) => {
    return (feature: FeatureLike) => {
        const size = feature.get('features').length;

        if (size === 1) return getSinglePOIStyle(feature);

        const cacheKey = `${color}_${size}`;

        let style = styleCache[cacheKey];
        if (!style) {
            style = new Style({
                image: new Circle({
                    radius: 12 + Math.min(size*0.5, 20),
                    fill: new Fill({
                        color: color,
                    }),
                    stroke: new Stroke({
                        color: '#fff',
                        width: 2
                    }),
                }),
                text: new Text({
                    text: size.toString(),
                    fill: new Fill({
                        color: '#fff',
                    }),
                }),
            });
            styleCache[cacheKey] = style;
        }
        return style;
    };
};

const clusterStyle = (feature: FeatureLike) => {
    const size = feature.get('features').length;

    if (size === 1) return getSinglePOIStyle(feature);

    let style = styleCache[size];
    if (!style) {
        style = new Style({
            image: new Circle({
                radius: 12 + Math.min(size * 2, 20),
                stroke: new Stroke({
                    color: '#fff',
                    width: 2
                }),
                fill: new Fill({
                    color: '#3399CC',
                }),
            }),
            text: new Text({
                text: size.toString(),
                fill: new Fill({
                    color: '#fff',
                }),
            }),
        });
        styleCache[size] = style;
    }
    return style;
}

export default clusterStyle;
