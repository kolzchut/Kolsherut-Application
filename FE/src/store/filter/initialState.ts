import israelLocation from "../../constants/israelLocation";

export const initialState = {
    filters:{
        responses: [] as string[],
        situations: [] as string[],
        location: israelLocation,
    },
    searchLocation: "",
};
export type FilterStore = typeof initialState;
