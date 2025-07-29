export const initialState = {
    page: "card",
    modal: null,
    cardId: "",
    searchQuery:"",
    loading: false,
    showSidebar: false,
    accessibilityActive: false
};
export type GeneralStore = typeof initialState;
