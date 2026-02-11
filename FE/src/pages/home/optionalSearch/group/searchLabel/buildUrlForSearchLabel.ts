const buildUrlForSearchLabel = ({situation,response,searchQuery}:{situation?:string, response?:string, searchQuery?:string})=>{
    let url = window.location.href+'p/results'
    if (searchQuery) url += `/sq/${searchQuery}`
    if (response) url += `/brf/${response}`
    if (situation) url += `/bsf/${situation}`
    return url;
}
export default buildUrlForSearchLabel;
