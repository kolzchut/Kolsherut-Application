import {Request, Response} from "express";
import logger from "../services/logger/logger";
import getCard from "../services/db/es/getCard";
import {asyncHandler} from "../middlewares/errorHandler";
import elasticFormater from "../services/db/es/elasticFormater";

const mockMoreServices = [
    {
        "branch_urls": null,
        "organization_phone_numbers": [
            "03-555-7890"
        ],
        "service_email_address": null,
        "branch_operating_unit": null,
        "situation_ids": [
            "human_situations:mental_health:addictions:alcohol",
            "human_situations:sectors:immigrants",
            "human_situations:language:russian_speaking"
        ],
        "organization_name_parts": {
            "secondary": null,
            "primary": "עמותת תקווה חדשה - סיוע לנפגעי התמכרויות ועולים חדשים"
        },
        "service_phone_numbers": [
            "054-123-4567"
        ],
        "organization_purpose": null,
        "organization_email_address": "tikvah.org.il@gmail.com",
        "organization_urls": [
            {
                "href": "https://newhope.org.il/",
                "title": "אתר העמותה"
            }
        ],
        "service_details": null,
        "organization_short_name": null,
        "service_implements": null,
        "branch_name": null,
        "service_urls": null,
        "organization_branch_count": 2,
        "organization_kind": "מלכ\"ר",
        "branch_geometry": [
            34.7818,
            32.0853
        ],
        "situations": [
            {
                "synonyms": [
                    "שתייה מופרזת",
                    "בעיית אלכוהול"
                ],
                "name": "התמכרות לאלכוהול",
                "id": "human_situations:mental_health:addictions:alcohol"
            },
            {
                "synonyms": [
                    "עולים חדשים",
                    "מהגרים"
                ],
                "name": "עולים חדשים",
                "id": "human_situations:sectors:immigrants"
            },
            {
                "synonyms": [
                    "רוסית",
                    "דוברי רוסית"
                ],
                "name": "דוברי רוסית",
                "id": "human_situations:language:russian_speaking"
            }
        ],
        "service_description": "העמותה מפעילה מרכז תמיכה בתל אביב עבור עולים חדשים המתמודדים עם התמכרויות. במסגרת הפעילות, ניתן לקבל ליווי פרטני, ייעוץ משפחתי, סדנאות קבוצתיות ותמיכה בשפת האם (רוסית). המרכז פתוח בימי חול ומנוהל ע\"י צוות רב-מקצועי הכולל פסיכולוגים, עובדים סוציאליים ומתנדבים מהקהילה.",
        "point_id": "34781832085300",
        "branch_phone_numbers": [],
        "service_name": "מרכז סיוע בהתמכרות לאלכוהול לעולים חדשים",
        "branch_email_address": null,
        "organization_name": "עמותת תקווה חדשה - סיוע לנפגעי התמכרויות ועולים חדשים",
        "card_id": "a9023471",
        "data_sources": [
            "**יש לוודא מראש את התאמת השירות לצרכיך.**",
            "המידע נאסף ממקורות פומביים או סופק ע\"י הארגון עצמו. ייתכנו אי דיוקים, שינויים או חוסרים. אין לראות במידע זה המלצה רשמית לשירות כלשהו."
        ],
        "branch_city": "תל אביב",
        "branch_description": null,
        "organization_id": "580123456",
        "national_service": false,
        "branch_address": "רחוב העלייה 42",
        "responses": [
            {
                "synonyms": [],
                "name": "סיוע בהתמכרות",
                "id": "human_services:internal_emergency_services"
            },
            {
                "synonyms": [
                    "תמיכה נפשית"
                ],
                "name": "שירותים נפשיים",
                "id": "human_services:mental_health"
            },
            {
                "synonyms": [
                    "שירותי קליטה"
                ],
                "name": "סיוע לעולים",
                "id": "human_services:immigrant_support"
            }
        ],
        "branch_location_accurate": true,
        "service_payment_details": "השירות ניתן ללא תשלום – יש לתאם מראש עם אנה, רכזת המרכז."
    },{
        "branch_urls": null,
        "organization_phone_numbers": [
            "04-998-2233"
        ],
        "service_email_address": null,
        "branch_operating_unit": null,
        "situation_ids": [
            "human_situations:health:disabilities:physical_disability",
            "human_situations:population:elderly",
            "human_situations:language:hebrew_speaking"
        ],
        "organization_name_parts": {
            "secondary": null,
            "primary": "לב הזהב - סיוע לאזרחים ותיקים ובעלי מוגבלות"
        },
        "service_phone_numbers": [
            "058-775-6644"
        ],
        "organization_purpose": null,
        "organization_email_address": "goldenheart.org@gmail.com",
        "organization_urls": [
            {
                "href": "https://goldenheart.org.il/",
                "title": "אתר לב הזהב"
            }
        ],
        "service_details": null,
        "organization_short_name": null,
        "service_implements": null,
        "branch_name": null,
        "service_urls": null,
        "organization_branch_count": 3,
        "organization_kind": "עמותה רשומה",
        "branch_geometry": [
            35.5013,
            33.2045
        ],
        "situations": [
            {
                "synonyms": [
                    "נכות פיזית",
                    "מוגבלות תנועה"
                ],
                "name": "בעלי מוגבלות פיזית",
                "id": "human_situations:health:disabilities:physical_disability"
            },
            {
                "synonyms": [
                    "קשישים",
                    "אזרחים ותיקים"
                ],
                "name": "אזרחים ותיקים",
                "id": "human_situations:population:elderly"
            },
            {
                "synonyms": [
                    "עברית",
                    "דוברי עברית"
                ],
                "name": "דוברי עברית",
                "id": "human_situations:language:hebrew_speaking"
            }
        ],
        "service_description": "עמותת לב הזהב מפעילה מרכז יום לאזרחים ותיקים ולבעלי מוגבלות פיזית במעלות-תרשיחא. המרכז מספק פעילות חברתית, ארוחות חמות, טיפולים פיזיותרפיים, ליווי אישי ותחבורה מהבית. השירות ניתן ללא עלות לתושבי האזור מעל גיל 67 או בעלי נכות מעל 60%.",
        "point_id": "35501333204500",
        "branch_phone_numbers": [],
        "service_name": "מרכז יום לאזרחים ותיקים ובעלי מוגבלות - לב הזהב",
        "branch_email_address": null,
        "organization_name": "לב הזהב - סיוע לאזרחים ותיקים ובעלי מוגבלות",
        "card_id": "b2938471",
        "data_sources": [
            "**המידע עשוי להשתנות – יש לבדוק מול הארגון.**",
            "הנתונים נאספו ממקורות ציבוריים או סופקו ע\"י נציגי הארגון ואינם מהווים התחייבות לזמינות או איכות השירות."
        ],
        "branch_city": "מעלות-תרשיחא",
        "branch_description": null,
        "organization_id": "580876543",
        "national_service": false,
        "branch_address": "רחוב הכרמל 7",
        "responses": [
            {
                "synonyms": [],
                "name": "שירותים לקשישים",
                "id": "human_services:elderly_support"
            },
            {
                "synonyms": [
                    "עזרה בניידות"
                ],
                "name": "סיוע פיזי",
                "id": "human_services:physical_assistance"
            },
            {
                "synonyms": [
                    "חברתיות",
                    "מפגשים"
                ],
                "name": "פעילויות חברתיות",
                "id": "human_services:social_activities"
            }
        ],
        "branch_location_accurate": true,
        "service_payment_details": "השירות חינמי במימון הרשות המקומית ומשרד הרווחה"
    }

]

export default asyncHandler(async (req: Request, res: Response) => {
    const {card_id} = req.params;
    const card = elasticFormater(await getCard(card_id))[0];
    card.moreServicesInBranch = mockMoreServices; // TODO:  Mock branches for testing purposes - change it
        logger.log({service: "Card Routes", message: `Fetched card with ID: ${card_id}`, payload: card});
    res.status(200).json({success: true, data: card});
});

