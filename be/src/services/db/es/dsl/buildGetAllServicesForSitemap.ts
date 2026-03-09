import vars from "../../../../vars";
import { serviceSitemapSourceFields } from "../sourceFields/serviceSitemapSourceFields";

interface BuildServicesQueryParams {
    pageSize?: number;
    scrollTime?: string;
}

export default ({ pageSize = 9000, scrollTime = "30s" }: BuildServicesQueryParams = {}) => {
    return {
        index: vars.serverSetups.elastic.indices.card,
        scroll: scrollTime,
        size: pageSize,
        body: {
            query: {
                match_all: {}
            },
            _source: serviceSitemapSourceFields
        }
    };
};
