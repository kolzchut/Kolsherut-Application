const collapseHitsByGroup = (hits: Array<any>): Array<any> => {
    return hits.map((hit) =>{
        hit.collapseHitsByGroups = reOrganizeCollapseHitsByGroups(hit.collapseHits)
        return hit;
    })
}

const reOrganizeCollapseHitsByGroups = (collapseHits: Array<any>):Array<{key:string, vals:Array<any>}>=> {
    const collapseHitsByGroup: Array<{key:string, vals:Array<any>}> = [];
    collapseHits.forEach((hit) => {
        const group = collapseHitsByGroup.find((group) => group.key === hit.organization_name);
        if (group) {
            group.vals.push(hit);
        } else {
            collapseHitsByGroup.push({key: hit.organization_name, vals: [hit]});
        }
    });
    return collapseHitsByGroup;
}
export default collapseHitsByGroup;

