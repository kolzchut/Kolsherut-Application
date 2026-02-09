export interface IStructureAutocomplete {
    label: string,
    query: string,
    situationId?: string,
    responseId?: string,
    bounds?: [number, number, number, number],
    cityName?: string,
    labelHighlighted?: string,
    score?: number
    by?: string
    serviceName?: string
}
export interface IUnStructuredAutocomplete {
    label: string,
    query: string,
    labelHighlighted?: string,
    cardId?: string,
    score?: number
    by?: string
}

export interface AutocompleteBuckets {
    structured?: IStructureAutocomplete[];
    unstructured?: IUnStructuredAutocomplete[];
}
