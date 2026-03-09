import axios from "axios";
import yaml from "js-yaml";
import { store } from "../store/store";
import { setTaxonomy } from "../store/data/dataSlice";
import { FlatNode, InputNode } from "../types/taxonomy";

const buildNode = (node: InputNode): FlatNode => ({
    slug: node.slug.replace('human_places','human_services:place'),
    subSlug: node.slug.split(':').slice(-1)[0],
    en: node.name?.source,
    he: node.name?.tx?.he || node.name?.source
});

const flattenData = (data: InputNode): FlatNode[] => {
    const result: FlatNode[] = [];

    const recursiveFlatten = (node: InputNode) => {
        if (!node) return;
        result.push(buildNode(node));
        if (!node.items || !Array.isArray(node.items)) return;
        for (const item of node.items) {
            recursiveFlatten(item);
        }
    };

    if (data) recursiveFlatten(data);


    return result;
};

export default async () => {
    const response = await axios.get(window.config.taxonomyUrl);
    const yamlText = response.data;

    const data = yaml.load(yamlText) as [InputNode, InputNode, InputNode];

    const rawResponses = data[0];
    const rawSituations = data[1];
    const rawPlaces = data[2];

    const responses = [...flattenData(rawResponses), ...flattenData(rawPlaces)];
    const situations =flattenData(rawSituations);
    store.dispatch(setTaxonomy({ responses, situations }));
};
