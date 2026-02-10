import {IStructureAutocomplete, IUnStructuredAutocomplete} from "../types/autocomplete";

type Kind = 'structured' | 'unstructured';

interface CombinedItem {
    type: Kind;
    score: number;
    item: IStructureAutocomplete | IUnStructuredAutocomplete;
}

interface TopInput {
    structured?: IStructureAutocomplete[];
    unstructured?: IUnStructuredAutocomplete[];
}

interface TopOutput {
    structured: IStructureAutocomplete[];
    unstructured: IUnStructuredAutocomplete[];
}

const normalizeInput = ({structured = [], unstructured = []}: TopInput) => ({structured, unstructured});
const scoreOf = (x: { score?: number }): number => (typeof x.score === 'number' && !Number.isNaN(x.score) ? x.score : 0);
const tag = (type: Kind) => (item: IStructureAutocomplete | IUnStructuredAutocomplete): CombinedItem => ({
    type,
    score: scoreOf(item),
    item
});
const combine = (structured: IStructureAutocomplete[], unstructured: IUnStructuredAutocomplete[]): CombinedItem[] => [
    ...structured.map(tag('structured')),
    ...unstructured.map(tag('unstructured')),
];
const clampLimit = (n: number) => Math.max(0, Math.trunc(n));

const selectTop = (combined: CombinedItem[], limit: number) =>
    combined.sort((a, b) => b.score - a.score).slice(0, clampLimit(limit));

const splitBack = (items: CombinedItem[]): TopOutput => items.reduce<TopOutput>((acc, cur) => {
    if (cur.type === 'structured') acc.structured.push(cur.item as IStructureAutocomplete);
    else acc.unstructured.push(cur.item as IUnStructuredAutocomplete);
    return acc;
}, {structured: [], unstructured: []});


export const pickTopAutocomplete = (input: TopInput, limit = 5): TopOutput => {
    const {structured, unstructured} = normalizeInput(input);
    const combined = combine(structured, unstructured);
    const top = selectTop(combined, limit);
    return splitBack(top);
};
