import {checkIfAnyFirstArrayValueExistsInSecondArrayValues} from "../../../services/str.ts";

export const checkIfFirstIdContainsSecondsIds = ({firstIds, secondIds}: { firstIds: string, secondIds: string }) => {
    if (!firstIds || !secondIds) return false;
    const firstIdsArray = firstIds.split(':').slice(1,).map(id => id.trim());
    const secondIdsArray = secondIds.split(':').slice(1).map(id => id.trim());
    return checkIfAnyFirstArrayValueExistsInSecondArrayValues({
        options: firstIdsArray,
        data: secondIdsArray
    })
}
