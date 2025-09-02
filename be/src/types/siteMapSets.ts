interface SiteMapSets {
    cards: { id: string, service_boost:number, last_modified: string }[];
    responses: { id: string, name: string, last_modified?: string }[];
    situations: { id: string, name: string, last_modified?: string }[]
}

export default SiteMapSets;
