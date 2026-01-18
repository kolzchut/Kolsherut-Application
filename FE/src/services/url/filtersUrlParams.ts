export default (paramsToRemove: Array<string>)=>{
    const params = new URLSearchParams(window.location.search);
    paramsToRemove.forEach(param => {params.delete(param)});
    const newParamsString = params.toString();
    if(!newParamsString) return '';
    return `?${newParamsString}`;
}
