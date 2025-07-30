import vars from "../../../../vars";

export default ({cardId, mainCardSourceFields}: {cardId:string, mainCardSourceFields:string[]})=>{

    return ({
        index: vars.serverSetups.elastic.indices.card,
        body: {
            size: 1,
            query: {
                term: {
                    card_id: cardId
                }
            },
            _source: mainCardSourceFields
        }
    })
}
