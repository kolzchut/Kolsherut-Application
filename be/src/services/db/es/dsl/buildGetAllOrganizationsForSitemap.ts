import vars from "../../../../vars";
import { organizationSitemapSourceFields } from "../sourceFields/organizationSitemapSourceFields";

interface BuildOrganizationsQueryParams {
    pageSize?: number;
    scrollTime?: string;
}

export default ({ pageSize = 9000, scrollTime = "30s" }: BuildOrganizationsQueryParams = {}) => {
    return {
        index: vars.serverSetups.elastic.indices.card,
        scroll: scrollTime,
        size: pageSize,
        body: {
            query: {
                match_all: {}
            },
            _source: organizationSitemapSourceFields
        }
    };
};
