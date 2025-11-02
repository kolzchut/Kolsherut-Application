const getHomeMetaTags = () =>{
    const metaTags = window.metaTags.home
    const macrosAndReplacements: { [key: string]: string } = {};
    return {metaTags, macrosAndReplacements, pageUrl:'https://www.kolsherut.org.il'}
}

export default getHomeMetaTags;
