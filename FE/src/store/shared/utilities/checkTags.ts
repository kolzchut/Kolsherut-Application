import {
    checkIfAllFirstArrayValuesExistsInSecondArrayValues,
    checkIfAnyFirstArrayValueExistsInSecondArrayValues
} from "../../../services/str.ts";

export const checkTags = ({ids, filters, checkAll}: { ids: string[], filters: string[], checkAll: boolean }) => {
    if (filters.length === 0) return true;
    if (checkAll) return checkIfAllFirstArrayValuesExistsInSecondArrayValues({mustBe: filters, data: ids});
    return checkIfAnyFirstArrayValueExistsInSecondArrayValues({options: filters, data: ids});
}
