import {IOrganization, IService} from "../../types/serviceType";
import ILocation from "../../types/locationType";

export const initialState = {
    searchOptions: {},
    results: [] as IService[],
    selectedOrganization: {
        organization: null as null | IOrganization,
        serviceId: null as null | string
    },
    locations: [] as ILocation[]
};
export type DataStore = typeof initialState;
