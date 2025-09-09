import vars from "../../../../vars";

interface BuildCardFieldsQueryParams {
    pageSize?: number;
    scrollTime?: string;
}

export default ({pageSize = 9000, scrollTime = "30s"}: BuildCardFieldsQueryParams = {}) => {
    const sourceFields = ["card_id", "service_boost", "last_modified"];

    return {
        index: vars.serverSetups.elastic.indices.card,
        scroll: scrollTime,
        size: pageSize,
        body: {
            query: {
                match_all: {}
            },
            _source: sourceFields
        }
    };
};
