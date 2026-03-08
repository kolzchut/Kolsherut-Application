import {buildUrl} from "../../../../../services/url/route.tsx";

const buildUrlForSearchLabel = ({situation,response}:{situation?:string, response?:string})=>{
    return buildUrl({
        p: 'results',
        ...(response ? {brf: response} : {}),
        ...(situation ? {bsf: situation} : {})
    })
}
export default buildUrlForSearchLabel;
