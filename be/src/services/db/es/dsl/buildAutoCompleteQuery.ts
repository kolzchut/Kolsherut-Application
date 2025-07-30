import vars from "../../../../vars";

export default (search: string) => {
    return ({
        index: vars.serverSetups.elastic.indices.autocomplete,
        body: {
            size: 5,
            query: {
                bool: {
                    must: {
                        match: {
                            query: {
                                query: search,
                                fuzziness: "AUTO"
                            }
                        }
                    }
                }
            },
        }
    });
}
