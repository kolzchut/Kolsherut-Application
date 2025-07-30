import vars from "../../../../vars";

export default ({branchKey, cardId,collapseSourceFields}:{branchKey:string, cardId:string,collapseSourceFields:string[]}) =>{

    return ({
        index: vars.serverSetups.elastic.indices.card,
        body: {
            size: 10,
            query: {
                bool: {
                    must: [
                        {term: {"branch_key": branchKey}}
                    ],
                    must_not: [
                        {term: {"card_id": cardId}}
                    ]
                }
            },
            _source: collapseSourceFields
        }
    })
}
