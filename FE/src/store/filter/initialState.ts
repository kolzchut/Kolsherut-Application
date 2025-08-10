import israelLocation from "../../constants/israelLocation";

export const initialState = {
    filters: {
        responses: [] as string[],
        situations: [] as string[],
        location: israelLocation,
    },
    searchLocation: "",
    backendFilters: {
        response: null as string | null,
        situation: null as string | null,
    }
};
export type FilterStore = typeof initialState;
