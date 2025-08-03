import Style from "ol/style/Style";
import {Circle, Fill, Stroke, Text} from "ol/style";
import {FeatureLike} from "ol/Feature";
import Feature from "ol/Feature";
import dynamicBranchStyle from "./dynamicBranchStyle";

const styleCache = new Map<string, Style>();
const MAX_CACHE_SIZE = 200;

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

        if (feature instanceof Feature) {
            feature.set('zIndex', size);
        }

        const cacheKey = `${color}_${size}`;

        let style = styleCache.get(cacheKey);
        if (!style) {
            const radius = Math.min(12 + size * 0.5, 32);

            style = new Style({
                image: new Circle({
                    radius,
                    fill: new Fill({
                        color: color,
                    }),
                    stroke: new Stroke({
                        color: '#fff',
                        width: 2
                    }),
                }),
                text: new Text({
                    text: size > 99 ? '99+' : size.toString(),
                    fill: new Fill({
                        color: '#fff',
                    }),
                    font: 'bold 12px sans-serif',
                }),
                zIndex: size
            });

            if (styleCache.size >= MAX_CACHE_SIZE) {
                const keysToDelete = Array.from(styleCache.keys()).slice(0, Math.floor(MAX_CACHE_SIZE * 0.1));
                keysToDelete.forEach(key => styleCache.delete(key));
            }

            styleCache.set(cacheKey, style);
        }
        return style;
    };
};

