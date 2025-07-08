import {IOrganization, IService} from "../../types/serviceType";
import ILocation from "../../types/locationType";

export const initialState = {
    searchOptions: {},
    results: [] as IService[],
    selectedOrganization: null as null | IOrganization,
    locations: [] as ILocation[]
};
export type DataStore = typeof initialState;
