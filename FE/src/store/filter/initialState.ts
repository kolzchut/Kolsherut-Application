export const initialState = {
    filters:{
        responses: [] as string[],
        situations: [] as string[]
    }
};
export type FilterStore = typeof initialState;
