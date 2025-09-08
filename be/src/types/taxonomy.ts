interface Taxonomy {
    name: {
        source: string;
        tx:{
            he: string;
        }
    };
    slug: string;
    items?: Taxonomy[];
}
export default Taxonomy;
