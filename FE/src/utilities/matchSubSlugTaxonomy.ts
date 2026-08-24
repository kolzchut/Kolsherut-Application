import {store} from "../store/store.ts";
import {getTaxonomy} from "../store/data/data.selector.ts";

export default (arr: string[]) => {
    const taxonomy = getTaxonomy(store.getState());
    let response = "";
    let situation = "";
    arr.forEach((item) => {
        if (!situation.length) {
            const taxonomySituation = taxonomy.situations.find((situationOption) => situationOption.subSlug === item);
            if (taxonomySituation?.slug) {
                situation = taxonomySituation.slug;
                return;
            }
        }
        if (!response.length) {
            const taxonomyResponse = taxonomy.responses.find((responseOption) => responseOption.subSlug === item);
            if (taxonomyResponse?.slug) response = taxonomyResponse.slug;
        }
    })
    return {response, situation};
}
