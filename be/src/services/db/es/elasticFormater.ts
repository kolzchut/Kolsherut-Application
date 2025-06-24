export default (elasticResponse: any) => elasticResponse.hits.hits.map((hit: any) => hit._source);
