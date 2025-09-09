import Taxonomy from "../../types/taxonomy";

const breakdownTaxonomy = (taxonomy: Taxonomy[]) => {
    const breakdown: Array<{ slug: string; query: string }> = [];

    const recurse = (items: Taxonomy[]) => {
        items.forEach(item => {
            const query = item.name.tx?.he ?? item.name.source ?? item.slug;
            breakdown.push({ slug: item.slug, query });
            if (item.items?.length) recurse(item.items);
        });
    };

    recurse(taxonomy);
    return breakdown;
};

export default breakdownTaxonomy;
