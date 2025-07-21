const getHomeMetaTags = () =>{
    const metaTags = window.metaTags.home
    const macrosAndReplacements: { [key: string]: string } = {};
    return {metaTags, macrosAndReplacements}
}

export default getHomeMetaTags;
