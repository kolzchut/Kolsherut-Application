import vars from "../../../../vars";

const buildSiteMapScrollQuery = (mainCardSourceFields: string[], pageSize: number = 9000) => {
    return {
        index: vars.serverSetups.elastic.indices.card,
        scroll: '30s',
        size: pageSize,
        body: {
            query: {
                match_all: {}
            },
            _source: mainCardSourceFields
        }
    };
};

export default buildSiteMapScrollQuery;
