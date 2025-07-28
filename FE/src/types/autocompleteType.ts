
export interface IStructureAutocomplete {
    label: string,
    query: string,
    situationId: string,
    responseId: string,
    bounds: [number, number, number, number],
    cityName: string,
}

export interface IUnStructuredAutocomplete {
    label: string,
    query: string,
}


export default interface AutocompleteType {
    structured: IStructureAutocomplete[],
    unstructured: IUnStructuredAutocomplete[],

}
