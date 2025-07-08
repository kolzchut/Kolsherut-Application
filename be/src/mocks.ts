export const mockServices = [
    {
        "id": "ServiceId123",
        "service_name": "שירותי בריאות למבוגרים",
        "service_description": `שירותי הטיפול במבוגרים מכורים נועדו לספק תמיכה מתמשכת, שיקום והתאמה לחיים יומיומיים עבור מבוגרים הנאבקים בהתמכרויות לסמים, אלכוהול או הפרעות התנהגותיות אחרות.
    השירותים כוללים תוכניות גמילה מפקחות, טיפול אישי וקבוצתי, חינוך על מניעת השנות והקניית כישורים להתמודדות עם מצבי חיים שונים.
    באמצעות צוות מקצועי של מטפלים, פסיכולוגים ואנשי בריאות מוסמכים, אנו מציעים טיפול כוללני המותאם לצרכים הספציפיים של כל מטופל.
    השירות שלנו מתמקד ביכולת של המטופלים לפתח ולהשיג מטרות אישיות משמעותיות, תוך תהליך תמיכה שמטרתו לשפר את איכות חייהם ולהגביר את ההתמודדות עם אתגרי החיים.
    כמו כן, אנו מספקים סדנאות חינוכיות למטופלים ולבני משפחותיהם כדי לקדם הבנה ותמיכה במהלך תהליך ההחלמה.`,
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
        "situations": [
            {"id": "HealthCare", "name": "שירותי בריאות"},
            {"id": "MentalHealthCare", "name": "שירותי בריאות נפש"},
            {"id": "DentalCare", "name": "שירותי שיניים"},
            {"id": "VisionCare", "name": "שירותי ראייה"},
            {"id": "PreventiveCare", "name": "שירותי מניעה"},
            {"id": "Rehabilitation", "name": "שיקום"},
            {"id": "ChronicDiseaseManagement", "name": "ניהול מחלה כרונית"},
            {"id": "EmergencyServices", "name": "שירותי חירום"},
            {"id": "PalliativeCare", "name": "טיפול פליאטיבי"},
            {"id": "HomeHealthCare", "name": "שירותי בית"}
        ],
        "organizations": [
            {
                "id": "org123",
                "name": "ארגון שירותי בריאות",
                "branches": [
                    {
                        "id": "branch123",
                        "name": null,
                        "address": null,
                        "isNational": true,
                        "isAccurate": false,
                        "geometry": [34.123, 31.2323],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch124",
                        "name": "מרכז קליני מרכזי",
                        "address": "456 שדרה טיפול, עיר הבריאות, HC 45678",
                        "isNational": true,
                        "isAccurate": true,
                        "geometry": [34.124, 31.2324],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch125",
                        "name": "מרכז בריאות המטה",
                        "address": "789 שדרה ריפוי, עיר הבריאות, HC 45678",
                        "isNational": true,
                        "isAccurate": false,
                        "geometry": [34.125, 31.2325],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch126",
                        "name": "מרפאת הבריאות הדרומית",
                        "address": "321 דרך התאוששות, עיר הבריאות, HC 45678",
                        "isNational": false,
                        "isAccurate": true,
                        "geometry": [34.126, 31.2326],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch127",
                        "name": "מרכז רפואי צפון",
                        "address": "654 רחוב הרפוי, בטוח עיר, HC 45678",
                        "isNational": true,
                        "isAccurate": true,
                        "geometry": [34.127, 31.2327],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    }
                ]
            },
            {
                "id": "org124",
                "name": "קבוצת בריאות שבין",
                "branches": [
                    {
                        "id": "branch128",
                        "name": "קליניקה מרכז",
                        "address": "432 רחוב התאמה, עיר הבריאות, HC 45678",
                        "isNational": true,
                        "isAccurate": true,
                        "geometry": [34.128, 31.2328],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch129",
                        "name": "מרפאה ראשית",
                        "address": "111 רחוב טוב, בריאות ברוג, HC 45678",
                        "isNational": false,
                        "isAccurate": true,
                        "geometry": [34.129, 31.2329],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch130",
                        "name": "מרפאת מזרח",
                        "address": "222 דרך הטוב, המלחנים, HC 45678",
                        "isNational": true,
                        "isAccurate": false,
                        "geometry": [34.130, 31.2330],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch131",
                        "name": "מרכז הבריאות",
                        "address": "333 שדרה הבריאות, האלטוואן, HC 45678",
                        "isNational": false,
                        "isAccurate": true,
                        "geometry": [34.131, 31.2331],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch132",
                        "name": "שירותי בריאות מערבית",
                        "address": "444 סמטת ריפוי, בטוחוויל, HC 45678",
                        "isNational": true,
                        "isAccurate": true,
                        "geometry": [34.132, 31.2332],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    }
                ]
            },
            {
                "id": "org125",
                "name": "בריאות עולמית קורפ",
                "branches": [
                    {
                        "id": "branch133",
                        "name": "מרכז בריאות צפון",
                        "address": "555 רחוב צפון, בריאותון, HC 45678",
                        "isNational": true,
                        "isAccurate": true,
                        "geometry": [34.133, 31.2333],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch134",
                        "name": "מרכז טיפול דרומי",
                        "address": "666 רחוב דרום, לרפואה, HC 45678",
                        "isNational": false,
                        "isAccurate": true,
                        "geometry": [34.134, 31.2334],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch135",
                        "name": "מרכז רפואי מערבי",
                        "address": "777 רחוב מערב, עיר רפואה, HC 45678",
                        "isNational": true,
                        "isAccurate": false,
                        "geometry": [34.135, 31.2335],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch136",
                        "name": "בריאות מחדש",
                        "address": "888 רחוב מזרח, עיר הבריאות, HC 45678",
                        "isNational": false,
                        "isAccurate": true,
                        "geometry": [34.136, 31.2336],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch137",
                        "name": "מרכז הרפואה המרכזי",
                        "address": "999 שדירת המרכז, קרית הבריאות, HC 45678",
                        "isNational": true,
                        "isAccurate": true,
                        "geometry": [34.137, 31.2337],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    }
                ]
            },
            {
                "id": "org126",
                "name": "רשת עירונית לבריאות",
                "branches": [
                    {
                        "id": "branch138",
                        "name": "מרכז בריאות עירוני",
                        "address": "101 כיכר מרכז עיר, עיר הבריאות, HC 45678",
                        "isNational": true,
                        "isAccurate": true,
                        "geometry": [34.138, 31.2338],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch139",
                        "name": "מרכז רפואי פרברי",
                        "address": "102 רחוב פרבר, prmurb, HC 45678",
                        "isNational": false,
                        "isAccurate": true,
                        "geometry": [35.539, 32.9339],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:community_services"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch140",
                        "name": "מכון בריאות מטרופוליטני",
                        "address": "103 שדירת מטרו, מטרופולין, HC 45678",
                        "isNational": true,
                        "isAccurate": false,
                        "geometry": [34.140, 31.2340],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch141",
                        "name": "בריאות אזורית",
                        "address": "104 דרך אזורית, Rehwwi Health, HC 45678",
                        "isNational": false,
                        "isAccurate": true,
                        "geometry": [35.141, 32.2341],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:education"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch142",
                        "name": "מרפאת בריאות הכפר",
                        "address": "105 רחוב הכפר, Villageville, HC 45678",
                        "isNational": true,
                        "isAccurate": true,
                        "geometry": [34.142, 31.2342],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    }
                ]
            }
        ]
    },
    {
        "id": "ServiceId124",
        "service_name": "טיפול רפואי ממוקד",
        "service_description": "זהו תיאור של טיפול רפואי הניתן למבוגרים.",
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
        "situations": [
            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
            {"id": "MedicalKits", "name": "ערכות רפואיות"},
            {"id": "MedicalRobotics", "name": "רובוטיקה רפואית"},
            {"id": "HealthTechnology", "name": "טכנולוגית בריאות"},
            {"id": "HealthLiterature", "name": "ספרות הבריאות"},
            {"id": "ProfessionalConsultation", "name": "ייעוץ מקצועי"},
            {"id": "MedicalAdvisors", "name": "יועצים רפואיים"},
            {"id": "EquipmentAndCertification", "name": "ציוד והסמכה"},
            {"id": "SuccessAssistance", "name": "מסייעה הצלחה"},
            {"id": "Hospitals", "name": "בתי חולים"}
        ],
        "organizations": [
            {
                "id": "org130",
                "name": "מרכזי רפואי עולמי",
                "branches": [
                    {
                        "id": "branch143",
                        "name": "עירוני מרכז בריאות",
                        "address": "106 כיכר מרכז עיר, עיר הבריאות, HC 45678",
                        "isNational": true,
                        "isAccurate": true,
                        "geometry": [34.143, 31.2343],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch144",
                        "name": "מרכז רפואי חירום",
                        "address": "107 חירום שדרה, עיר הרפואה, HC 45678",
                        "isNational": false,
                        "isAccurate": true,
                        "geometry": [34.144, 31.2344],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch145",
                        "name": "מרכז רפואי משפחתי",
                        "address": "108 משפחה רחוב, הרפואה, HC 45678",
                        "isNational": true,
                        "isAccurate": false,
                        "geometry": [34.145, 31.2345],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch146",
                        "name": "מרכז תחזוקה העיר",
                        "address": "109 תחזוקה שדרה, הרפואה, HC 45678",
                        "isNational": false,
                        "isAccurate": true,
                        "geometry": [34.146, 31.2346],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch147",
                        "name": "מרכז שירותי עירוני",
                        "address": "110 שירותים רחוב, הרפואה עיר, HC 45678",
                        "isNational": true,
                        "isAccurate": true,
                        "geometry": [34.147, 31.2347],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    }
                ]
            },
            {
                "id": "org128",
                "name": "חברת שירותי בריאות",
                "branches": [
                    {
                        "id": "branch148",
                        "name": "מערכת בריאות ביניימית",
                        "address": "111 בריאות שדרה, עיר הבריאות, HC 45678",
                        "isNational": true,
                        "isAccurate": true,
                        "geometry": [34.148, 31.2348],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch149",
                        "name": "מרכז תחזוקה בריאותית",
                        "address": "112 תחזוקה רחוב, עיר הבריאות, HC 45678",
                        "isNational": false,
                        "isAccurate": true,
                        "geometry": [34.149, 31.2349],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch150",
                        "name": "מרכזי בריאות עולמי",
                        "address": "113 עולמי שדרה, עיר הבריאות, HC 45678",
                        "isNational": true,
                        "isAccurate": false,
                        "geometry": [34.150, 31.2350],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch151",
                        "name": "מערכת רפואית שיתוף",
                        "address": "114 שיתוף רחוב, בריאותון, HC 45678",
                        "isNational": false,
                        "isAccurate": true,
                        "geometry": [34.151, 31.2351],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch152",
                        "name": "מרכז שיתוף פעולה",
                        "address": "115 שיתוף פעולה רחוב, עיר הבריאות, HC 45678",
                        "isNational": true,
                        "isAccurate": true,
                        "geometry": [34.152, 31.2352],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch153",
                        "isNational": true,
                        "isAccurate": false,
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch154",
                        "name": "מרכז חירום צפוני",
                        "address": "200 חירום שדרה, עיר בריאות, HC 45679",
                        "isNational": false,
                        "isAccurate": true,
                        "geometry": [34.154, 31.2354],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch155",
                        "name": "יחידת סיוע רפואית",
                        "address": "201 סיוע רחוב, בריאותון, HC 45680",
                        "isNational": false,
                        "isAccurate": false,
                        "geometry": [34.155, 31.2355],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch156",
                        "isNational": true,
                        "isAccurate": false,
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch157",
                        "isNational": true,
                        "isAccurate": false,
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch158",
                        "name": "תחנת חילוץ מהירה",
                        "address": "202 חילוץ רחוב, אזור בריאות, HC 45681",
                        "isNational": false,
                        "isAccurate": true,
                        "geometry": [34.158, 31.2358],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch159",
                        "name": "מרכז טיפולים מתקדמים",
                        "address": "203 טיפולים שדרה, בריאות העיר, HC 45682",
                        "isNational": false,
                        "isAccurate": false,
                        "geometry": [34.159, 31.2359],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch160",
                        "isNational": true,
                        "isAccurate": false,
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch161",
                        "name": "מרפאת לילה אזורית",
                        "address": "204 לילה רחוב, מרכז העיר, HC 45683",
                        "isNational": false,
                        "isAccurate": true,
                        "geometry": [34.912, 32.1372],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch162",
                        "name": "מוקד בריאות נייד",
                        "address": "205 נייד שדרה, ניידון, HC 45684",
                        "isNational": false,
                        "isAccurate": true,
                        "geometry": [34.5752, 32.5572],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch163",
                        "isNational": true,
                        "isAccurate": false,
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch164",
                        "isNational": true,
                        "isAccurate": false,
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch165",
                        "name": "תחנת חיסון מקומית",
                        "address": "206 חיסון רחוב, מרכז העיר, HC 45685",
                        "isNational": false,
                        "isAccurate": false,
                        "geometry": [34.222, 32.1372],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch166",
                        "name": "תחנת מיון רפואי",
                        "address": "207 מיון שדרה, עיר הבריאות, HC 45686",
                        "isNational": false,
                        "isAccurate": true,
                        "geometry": [34.272, 32.9072],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch167",
                        "isNational": true,
                        "isAccurate": false,
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch168",
                        "name": "מרכז טיפול בשטח",
                        "address": "208 שטח רחוב, מרחב בריאות, HC 45687",
                        "isNational": false,
                        "isAccurate": false,
                        "geometry": [34.372, 32.872],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch169",
                        "isNational": true,
                        "isAccurate": false,
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch170",
                        "name": "יחידת עזרה ראשונה",
                        "address": "209 עזרה רחוב, עיר בריאות, HC 45688",
                        "isNational": false,
                        "isAccurate": true,
                        "geometry": [34.572, 32.2322],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch171",
                        "isNational": true,
                        "isAccurate": false,
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    },
                    {
                        "id": "branch172",
                        "name": "תחנת טיפול מיידי",
                        "address": "210 מיידי שדרה, בריאותון, HC 45689",
                        "isNational": false,
                        "isAccurate": false,
                        "geometry": [34.672, 32.2372],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],
                    }

                ]
            }
        ]
    },
    {
        "id": "ThirdServiceId125",
        "service_name": "מענקי אוכל לבדואים",
        "service_description": "שירות זה נועד בכדי לדאוג שלכל בדואי תיהיה מנת אוכל יומית. השירות כולל אספקת מזון בסיסי, כמו לחם, ירקות ופירות, בשר ודגנים.",
        "responses": [
            {
                "synonyms": [],
                "name": "שירותים לבדואים",
                "id": "human_services:bedoi_support"
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
        "situations": [
            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
            {"id": "MedicalKits", "name": "ערכות רפואיות"},
        ],
        "organizations": [
            {
                "id": "org127",
                "name": "מרכזי רפואי עולמי",
                "branches": [
                    {
                        "id": "branch143",
                        "name": "חלוקת אוכל לבדואים",
                        "address": "106 כיכר מרכז עיר, ערד, HC 45678",
                        "isNational": true,
                        "isAccurate": true,
                        "geometry": [34.143, 31.2343],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "שירותים לבדואים",
                                "id": "human_services:bedoi_support"
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
                        "situations": [
                            {"id": "MedicalProcedure", "name": "ההליך רפואי"},
                            {"id": "MedicalKits", "name": "ערכות רפואיות"},
                        ],

                    },
                ]
            }
        ]
    }, {
        "id": "ServiceId128",
        "service_name": "שירותי תמיכה לנפגעי טראומה",
        "service_description": `השירותים נועדו לספק תמיכה וליווי לנפגעי טראומה. השירות כולל טיפול פסיכולוגי, סדנאות קבוצתיות, וייעוץ פרטני.`,
        "responses": [
            {
                "synonyms": [],
                "name": "תמיכה נפשית",
                "id": "human_services:mental_health_support"
            },
            {
                "synonyms": [
                    "טיפול פסיכולוגי"
                ],
                "name": "שירותים פסיכולוגיים",
                "id": "human_services:psychological_services"
            }
        ],
        "situations": [
            {"id": "TraumaCare", "name": "טיפול בטראומה"},
            {"id": "EmotionalSupport", "name": "תמיכה רגשית"}
        ],
        "organizations": [
            {
                "id": "org2002",
                "name": "עמותת תקווה לנפגעי טראומה",
                "branches": [
                    {
                        "id": "branch232332",
                        "name": "מרכז טיפול תל אביב",
                        "address": "123 רחוב התקווה, תל אביב, HC 45678",
                        "isNational": true,
                        "isAccurate": true,
                        "geometry": [34.7818, 32.0853],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "תמיכה נפשית",
                                "id": "human_services:care:recovery"
                            }
                        ],
                        "situations": [
                            {"id": "TraumaCare", "name": "טיפול בטראומה"}
                        ]
                    },
                    {
                        "id": "branch55555",
                        "name": "מרכז טיפול חיפה",
                        "address": "456 רחוב השלום, חיפה, HC 45678",
                        "isNational": false,
                        "isAccurate": true,
                        "geometry": [34.9895, 32.7940],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "תמיכה נפשית",
                                "id": "human_services:mental_health_support"
                            }
                        ],
                        "situations": [
                            {"id": "TraumaCare", "name": "טיפול בטראומה"}
                        ]
                    },
                    {
                        "id": "branch12344",
                        "name": "מרכז טיפול ירושלים",
                        "address": "789 רחוב האמונה, ירושלים, HC 45678",
                        "isNational": true,
                        "isAccurate": true,
                        "geometry": [35.2137, 31.7683],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "תמיכה נפשית",
                                "id": "human_services:mental_health_support"
                            }
                        ],
                        "situations": [
                            {"id": "TraumaCare", "name": "טיפול בטראומה"}
                        ]
                    }
                ]
            }
        ]
    },  {
        "id": "ServiceId125",
        "service_name": "שירותי תמיכה לנוער בסיכון",
        "service_description": `השירותים נועדו לספק תמיכה, ליווי והכוונה לנוער בסיכון. השירות כולל מפגשים קבוצתיים, ייעוץ פרטני, סדנאות חינוכיות ותמיכה פסיכולוגית.`,
        "responses": [
            {
                "synonyms": [],
                "name": "סיוע לנוער בסיכון",
                "id": "human_services:youth_support"
            },
            {
                "synonyms": [
                    "תמיכה רגשית"
                ],
                "name": "שירותים רגשיים",
                "id": "human_services:emotional_support"
            }
        ],
        "situations": [
            {"id": "YouthCare", "name": "טיפול בנוער"},
            {"id": "EducationSupport", "name": "תמיכה חינוכית"}
        ],
        "organizations": [
            {
                "id": "org127",
                "name": "עמותת נוער בטוח",
                "branches": [
                    {
                        "id": "branch150",
                        "name": "מרכז תמיכה לנוער",
                        "address": "123 רחוב הנוער, עיר התקווה, HC 45678",
                        "isNational": true,
                        "isAccurate": true,
                        "geometry": [34.150, 31.2350],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "סיוע לנוער בסיכון",
                                "id": "human_services:youth_support"
                            }
                        ],
                        "situations": [
                            {"id": "YouthCare", "name": "טיפול בנוער"}
                        ]
                    }
                ]
            }
        ]
    },
    {
        "id": "ServiceId126",
        "service_name": "שירותי סיוע לנכים",
        "service_description": `השירותים כוללים ליווי אישי, סיוע בניידות, טיפולים פיזיותרפיים ותמיכה חברתית לנכים.`,
        "responses": [
            {
                "synonyms": [],
                "name": "סיוע לנכים",
                "id": "human_services:place"
            },
            {
                "synonyms": [
                    "עזרה בניידות"
                ],
                "name": "סיוע פיזי",
                "id": "human_services:education"
            }
        ],
        "situations": [
            {"id": "DisabilityCare", "name": "טיפול בנכים"},
            {"id": "MobilitySupport", "name": "תמיכה בניידות"}
        ],
        "organizations": [
            {
                "id": "org128",
                "name": "עמותת נכים למען נכים",
                "branches": [
                    {
                        "id": "branch151",
                        "name": "מרכז סיוע לנכים",
                        "address": "456 רחוב הנכים, עיר הבריאות, HC 45678",
                        "isNational": true,
                        "isAccurate": true,
                        "geometry": [34.151, 31.2351],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "סיוע לנכים",
                                "id": "human_services:disability_support"
                            }
                        ],
                        "situations": [
                            {"id": "DisabilityCare", "name": "טיפול בנכים"}
                        ]
                    }
                ]
            }
        ]
    },
    {
        "id": "ServiceId127",
        "service_name": "שירותי תמיכה למשפחות",
        "service_description": `השירותים כוללים ייעוץ משפחתי, סדנאות חינוכיות ותמיכה רגשית למשפחות המתמודדות עם אתגרים.`,
        "responses": [
            {
                "synonyms": [],
                "name": "ייעוץ משפחתי",
                "id": "human_services:family_counseling"
            },
            {
                "synonyms": [
                    "תמיכה רגשית"
                ],
                "name": "שירותים רגשיים",
                "id": "human_services:emotional_support"
            }
        ],
        "situations": [
            {"id": "FamilySupport", "name": "תמיכה משפחתית"},
            {"id": "EmotionalCare", "name": "טיפול רגשי"}
        ],
        "organizations": [
            {
                "id": "org129",
                "name": "עמותת משפחות חזקות",
                "branches": [
                    {
                        "id": "branch152",
                        "name": "מרכז תמיכה למשפחות",
                        "address": "789 רחוב המשפחה, עיר הבריאות, HC 45678",
                        "isNational": true,
                        "isAccurate": true,
                        "geometry": [34.152, 31.2352],
                        "responses": [
                            {
                                "synonyms": [],
                                "name": "ייעוץ משפחתי",
                                "id": "human_services:family_counseling"
                            }
                        ],
                        "situations": [
                            {"id": "FamilySupport", "name": "תמיכה משפחתית"}
                        ]
                    }
                ]
            }
        ]
    }
]


export const mockMoreServices = [
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
    }, {
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
