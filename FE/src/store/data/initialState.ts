import {IOrganization, IService} from "../../types/serviceType";
import ILocation from "../../types/locationType";
import ISitemap from "../../types/sitemapType.ts";
import {FlatNode} from "../../types/taxonomy.ts";

export const initialState = {
    results: [] as IService[],
    sitemap: {} as ISitemap,
    taxonomy: {
        situations: [] as FlatNode[],
        responses: [] as FlatNode[]
    },
    selectedOrganization: {
        organization: null as null | IOrganization,
        serviceId: null as null | string
    },
    locations: [] as ILocation[]
};
export type DataStore = typeof initialState;
