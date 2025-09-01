import vars from "../../../../vars";

export default (title: string) => ({
    index: vars.serverSetups.elastic.indices.autocomplete,
    body: {
        from: 0,
        size: 1,
        query: {
            match: {
                "query": title
            }
        }
    }
});
