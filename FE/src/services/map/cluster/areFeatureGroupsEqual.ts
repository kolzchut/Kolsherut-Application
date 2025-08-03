import {Feature} from "ol";
import {Geometry} from "ol/geom";

const areFeatureGroupsEqual = (
    newGroups: { [color: string]: Feature<Geometry>[] },
    oldGroups: { [color: string]: Feature<Geometry>[] }
): boolean => {
    const newColors = Object.keys(newGroups);
    const oldColors = Object.keys(oldGroups);

    if (newColors.length !== oldColors.length) return false;

    for (const color of newColors) {
        if (!oldGroups[color]) return false;
        if (newGroups[color].length !== oldGroups[color].length) return false;


        const newFeatures = newGroups[color];
        const oldFeatures = oldGroups[color];

        const sampleSize = Math.min(3, newFeatures.length);
        for (let i = 0; i < sampleSize; i++) {
            if (newFeatures[i].getId() !== oldFeatures[i].getId()) return false;
        }
    }

    return true;
};

export default areFeatureGroupsEqual;
