const getHomeJsonLd = () => {
    const templates = window.jsonLd.home;
    const macrosAndReplacements: { [key: string]: string } = {};
    return {templates, macrosAndReplacements};
}

export default getHomeJsonLd;
