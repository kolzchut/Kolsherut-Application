import ILocation from "../types/locationType";
import {getCurrentLocationBounds} from "../services/geoLogic";

const getDefaultLocations = async (): Promise<ILocation[]> => {
    const configDefaultLocations = window.config?.defaultLocations || [];
    const defaultLocations: ILocation[] = [];
    const userBounds = await getCurrentLocationBounds();
    if (userBounds) {
        defaultLocations.push({
            key: configDefaultLocations[0]?.key || "Current Location",
            bounds: userBounds.bounds,
        })
    }
    defaultLocations.push();
    for (let i = 1; i < configDefaultLocations.length; i++) {
        const location = configDefaultLocations[i];
        if (location && location.key && location.bounds) {
            defaultLocations.push({
                key: location.key,
                bounds: location.bounds
            });
        }
    }

    return defaultLocations;
}
export default getDefaultLocations;
