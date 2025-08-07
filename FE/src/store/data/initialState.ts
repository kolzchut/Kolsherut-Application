import {IOrganization, IService} from "../../types/serviceType";
import ILocation from "../../types/locationType";
import ISitemap from "../../types/sitemapType.ts";

export const initialState = {
    results: [] as IService[],
    sitemap: {} as ISitemap,
    selectedOrganization: {
        organization: null as null | IOrganization,
        serviceId: null as null | string
    },
    locations: [] as ILocation[]
};
export type DataStore = typeof initialState;
