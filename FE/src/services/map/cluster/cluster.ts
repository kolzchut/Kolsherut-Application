import {Cluster} from "ol/source";
import VectorSource from "ol/source/Vector";
import {Feature} from "ol";
import {Geometry, Point} from "ol/geom";

const clusterSourceCache = new Map<string, Cluster>();

export const createColorBasedClusterSources = (featuresByColor: { [color: string]: Feature<Geometry>[] }) => {
    const clusterSources: { [color: string]: Cluster } = {};

    Object.entries(featuresByColor).forEach(([color, features]) => {
        const cacheKey = `${color}_${features.length}_${features.slice(0, 3).map(f => f.getId()).join(',')}`;
        let clusterSource = clusterSourceCache.get(cacheKey);

        if (!clusterSource) {
            const vectorSource = new VectorSource({
                features,
                useSpatialIndex: true
            });

            clusterSource = new Cluster({
                distance: 50,
                minDistance: 10,
                source: vectorSource,
                geometryFunction: (feature: Feature<Geometry>) => {
                    return feature.getGeometry() as Point || null;
                }
            });
            if (clusterSourceCache.size > 20) {
                const firstKey = clusterSourceCache.keys().next().value;
                if(firstKey) clusterSourceCache.delete(firstKey);
            }
            clusterSourceCache.set(cacheKey, clusterSource);
        } else {
            const vectorSource = clusterSource.getSource() as VectorSource;
            vectorSource.clear();
            vectorSource.addFeatures(features);
        }

        clusterSources[color] = clusterSource;
    });

    return clusterSources;
}
