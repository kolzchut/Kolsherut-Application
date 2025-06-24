import SearchValue from "../types/searchValue";

export default (rawSearchValues: SearchValue[]) => {
    const groups: { [key: string]: SearchValue[] } = {};
    rawSearchValues.forEach((value) => {
        if (!groups[value.group]) {
            groups[value.group] = [];
        }
        groups[value.group].push(value);
    });
    return groups;
};
