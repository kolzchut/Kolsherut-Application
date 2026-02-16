export default ({url, removeParameters}: { url: string, removeParameters: string[] }) => {
    const splitUrl = url.split('/');
    for (let i = 0; i < splitUrl.length; i++) {
        if (!removeParameters.some(parameter => splitUrl[i].startsWith(parameter))) continue
        splitUrl.splice(i, 2);
        i -= 2;
    }
    return splitUrl.join('/');
}
