export default (elasticResponse: any) => elasticResponse.hits.hits.map((hit: any) => {
    const source = hit._source;
    source.collapseHits = hit?.inner_hits?.collapse_hits?.hits?.hits?.map((hit: any) => hit._source) || [];
    return source;
});
