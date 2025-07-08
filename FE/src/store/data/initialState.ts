import {IOrganization, IService} from "../../types/serviceType";

export const initialState = {
    searchOptions: {},
    results: [] as IService[],
    selectedOrganization: null as null | IOrganization,
};
export type DataStore = typeof initialState;
