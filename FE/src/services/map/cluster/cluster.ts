import {Cluster} from "ol/source";
import VectorSource from "ol/source/Vector";
import {Feature} from "ol";
import {Geometry} from "ol/geom";

export const createColorBasedClusterSources = (featuresByColor: { [color: string]: Feature<Geometry>[] }) => {
    const clusterSources: { [color: string]: Cluster } = {};

    Object.entries(featuresByColor).forEach(([color, features]) => {
        const vectorSource = new VectorSource({ features });
        clusterSources[color] = new Cluster({
            distance: 50,
            minDistance: 10,
            source: vectorSource
        });
    });

    return clusterSources;
}

