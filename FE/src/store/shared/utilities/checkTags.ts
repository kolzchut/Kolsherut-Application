import {
    checkIfAllFirstArrayValuesExistsInSecondArrayValues,
    checkIfAnyFirstArrayValueExistsInSecondArrayValues
} from "../../../services/str.ts";

export const checkTags = ({ids, filters, checkAll}: { ids: string[], filters: string[], checkAll: boolean }) => {
    if (filters.length === 0 || filters.length === 0) return true;
    const idsTags = ids.flatMap(tag => tag.split(':').map(t => t.trim()));
    const filterTags = filters.flatMap(tag => tag.split(':').map(t => t.trim()));
    if (checkAll) return checkIfAllFirstArrayValuesExistsInSecondArrayValues({mustBe: filterTags, data: idsTags});
    return checkIfAnyFirstArrayValueExistsInSecondArrayValues({options: filterTags, data: idsTags});
}
