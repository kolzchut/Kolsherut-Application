export const initialState = {
    page: "card",
    modal: null,
    cardId: "",
    searchQuery:"",
    loading: false,
    showSidebar: false,
    accessibilityActive: false,
    firstVisitedUrl: null as string | null,
    selectedFeatureId: null as string | null,
    oldURL: false
};
export type GeneralStore = typeof initialState;
