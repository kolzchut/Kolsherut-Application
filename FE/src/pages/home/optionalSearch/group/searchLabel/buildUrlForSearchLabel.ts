const buildUrlForSearchLabel = ({situation,response,searchQuery}:{situation?:string, response?:string, searchQuery?:string})=>{
    let url = window.location.href+'p/results'
    if (situation) url += `/bsf/${situation}`
    if (response) url += `/brf/${response}`
    if (searchQuery) url += `/sq/${searchQuery}`
    return url;
}
export default buildUrlForSearchLabel;
