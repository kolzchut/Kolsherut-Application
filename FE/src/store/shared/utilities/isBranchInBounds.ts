import { IBranch } from "../../../types/serviceType.ts";
import { checkIfCoordinatesInBounds } from "../../../services/geoLogic.ts";

const isBranchInBounds = (branch: IBranch, bounds: [number, number, number, number]): boolean => {
    return branch.isNational || checkIfCoordinatesInBounds({
        bounds,
        coordinates: branch.geometry
    });
};

export default isBranchInBounds;
