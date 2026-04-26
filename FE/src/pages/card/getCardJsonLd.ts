import {ICard} from "../../types/cardType";
import type {JsonValue} from "../../services/jsonLd/jsonLd";

const getCardJsonLd = ({card, cardUrl}: { card: ICard; cardUrl: string }) => {
    const templates: JsonValue[] = window.jsonLd.card;
    const defaults = window.jsonLd.defaults;
    const baseUrl = window.environment.currentURL;
    const siteName = window.strings.footer.nameOfWebsite;

    const responseNames = card.responses?.map(r => r.name).join(", ") || "";
    const situationNames = card.situations?.map(s => s.name).join(", ") || "";
    const areaServed = card.national_service ? defaults.country : (card.branch_city || defaults.country);

    const breadcrumbs = buildCardBreadcrumbs(card, cardUrl, baseUrl, siteName);

    const macrosAndReplacements: Record<string, string> = {
        "%%serviceName%%": card.service_name || "",
        "%%serviceDescription%%": card.service_description || "",
        "%%cardUrl%%": cardUrl,
        "%%organizationName%%": card.organization_name || "",
        "%%areaServed%%": areaServed,
        "%%responseNames%%": responseNames,
        "%%situationNames%%": situationNames,
    };

    const objectReplacements: Record<string, JsonValue> = {
        "%%breadcrumbs%%": breadcrumbs,
    };

    return {templates, macrosAndReplacements, objectReplacements};
};

function buildCardBreadcrumbs(card: ICard, cardUrl: string, baseUrl: string, siteName: string) {
    const items: JsonValue[] = [
        {
            "@type": "ListItem",
            "position": 1,
            "name": siteName,
            "item": `${baseUrl}/`
        }
    ];

    if (card.responses?.length > 0) {
        const response = card.responses[0];
        items.push({
            "@type": "ListItem",
            "position": 2,
            "name": response.name,
            "item": `${baseUrl}/${response.id}`
        });
    }

    if (card.situations?.length > 0) {
        const situation = card.situations[0];
        const responsePrefix = card.responses?.length > 0 ? `${card.responses[0].id}/` : "";
        items.push({
            "@type": "ListItem",
            "position": items.length + 1,
            "name": situation.name,
            "item": `${baseUrl}/${responsePrefix}${situation.id}`
        });
    }

    items.push({
        "@type": "ListItem",
        "position": items.length + 1,
        "name": card.service_name || "",
        "item": cardUrl
    });

    return items;
}

export default getCardJsonLd;
