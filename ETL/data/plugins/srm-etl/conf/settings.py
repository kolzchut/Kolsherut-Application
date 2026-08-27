from dotenv import load_dotenv

from .utils import EnvVarStrategy as s
from .utils import get_env

load_dotenv()

import csv

csv.field_size_limit(2*1024*1024)


CLICK_API = r'https://clickrevaha-app.molsa.gov.il/public/solr?rows=1000&fq[]=lang_code_s:he&facet.limit=2000&defType=edismax&fq[]=group_id_is:1&fq[]=type_i:1&facet.field[]=group_id_is&facet.field[]={!ex=Target_Population_A_ss,Target_Population_ss}Target_Population_A_ss&facet.field[]={!ex=Target_Population_A_ss,Target_Population_ss}Target_Population_ss&facet.field[]={!ex=Domin_ss}Domin_ss&q=*&start=0&group.ngroups=true&group.field=GroupFamilyName_s&facet.pivot={!ex=Target_Population_A_ss,Target_Population_ss}Target_Population_A_ss,Target_Population_ss&mm=50%&pf[]=FamilyName_t^30 Service_Purpose_t^22 Age_Minimum_i^10 Age_Maximum_i^10 Target_Population_A_t^14  Target_Population_t^14 Domin_t^8 Naming_Outputs_t^6&qf[]=FamilyName_t^15 Service_Purpose_t^11 Age_Minimum_i^5 Age_Maximum_i^5 Target_Population_A_t^7  Target_Population_t^7 Domin_t^4 Naming_Outputs_t^3 text^1&bq[]=(product_id_i:(498 OR 198 OR 484))^0.005&bq[]=(product_id_i:(612))^200&fq[]=distribution_channel_is:1&fq[]=-group_name_s:"כתובות"'
# https://clickrevaha-sys.molsa.gov.il/api/solr?rows=1000'

GOV_DATA_PROXY = 'https://www.gov.il/he/api/DataGovProxy/GetDGResults'

GUIDESTAR_USERNAME = get_env('ETL_GUIDESTAR_USERNAME')
GUIDESTAR_PASSWORD = get_env('ETL_GUIDESTAR_PASSWORD')
GUIDESTAR_API = 'https://www.guidestar.org.il/services/apexrest/api'

GOVMAP_API_KEY = get_env('ETL_GOVMAP_API_KEY')
GOVMAP_AUTH = 'https://ags.govmap.gov.il/Api/Controllers/GovmapApi/Auth'
GOVMAP_REQUEST_ORIGIN = 'https://www.kolzchut.org.il'
GOVMAP_GEOCODE_API = 'https://ags.govmap.gov.il/Api/Controllers/GovmapApi/Geocode'

AIRTABLE_BASE = get_env('ETL_AIRTABLE_BASE')
AIRTABLE_STAGING_BASE = get_env('ETL_AIRTABLE_STAGING_BASE')
AIRTABLE_ALTERNATE_BASE = get_env('ETL_AIRTABLE_ALTERNATE_BASE')
AIRTABLE_DATAENTRY_BASE = get_env('ETL_AIRTABLE_DATAENTRY_BASE')
AIRTABLE_DATA_IMPORT_BASE = get_env('ETL_AIRTABLE_DATA_IMPORT_BASE')

AIRTABLE_VIEW = 'Grid view'
AIRTABLE_LOCATION_TABLE = 'Locations'
AIRTABLE_ORGANIZATION_TABLE = 'Organizations'
AIRTABLE_SERVICE_TABLE = 'Services'
AIRTABLE_BRANCH_TABLE = 'Branches'
AIRTABLE_SERVICE_TABLE = 'Services'
AIRTABLE_RESPONSE_TABLE = 'Responses'
AIRTABLE_SITUATION_TABLE = 'Situations'
AIRTABLE_PRESETS_TABLE = 'Presets'
AIRTABLE_HOMEPAGE_TABLE = 'Homepage'
AIRTABLE_MANUAL_FIXES_TABLE = 'Manual Fixes'
AIRTABLE_STATS_TABLE = 'Stats'
AIRTABLE_CARDS_TABLE = 'Cards'
AIRTABLE_TAXONOMY_MAPPING_GUIDESTAR_TABLE = 'Guidestar Service Taxonomy Mapping'
AIRTABLE_TAXONOMY_MAPPING_SOPROC_TABLE = 'soproc-service-tagging'
AIRTABLE_TAXONOMY_MAPPING_CLICK_TABLE = 'Click Service Taxonomy Mapping'

AIRTABLE_API_KEY = get_env('DATAFLOWS_AIRTABLE_APIKEY')

GOOGLE_MAPS_API_KEY = get_env('ETL_GOOGLE_MAPS_API_KEY')

GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 = get_env('ETL_GOOGLE_SERVICE_ACCOUNT_JSON_BASE64', required=False)

OPENELIGIBILITY_YAML_URL = (
    'https://raw.githubusercontent.com/kolzchut/openeligibility/main/taxonomy.tx.yaml'
)

BUDGETKEY_QUERY_API = 'https://next.obudget.org/api/query'
BUDGETKEY_QUERY_TIMEOUT_SECONDS = 60

DATAGOVIL_BASE = 'https://data.gov.il'
DATAGOVIL_PACKAGE_SEARCH_API = 'https://data.gov.il/api/action/package_search'
DATAGOVIL_PACKAGE_SHOW_API = 'https://data.gov.il/api/3/action/package_show'
DATAGOVIL_DATASTORE_SEARCH_API = 'https://data.gov.il/api/3/action/datastore_search'
DATAGOVIL_REQUEST_TIMEOUT_SECONDS = 60

DATA_DUMP_DIR = 'data'

ENV_NAME = get_env('ENV_NAME')
ES_HOST = get_env('ES_HOST')
ES_PORT = int(get_env('ES_PORT'))
ES_HTTP_AUTH = get_env('ES_HTTP_AUTH', required=False)


# Audit repository for the publish operator's Airtable writes (feature is a
# no-op when AUDIT_REPO_FULL_NAME is unset). Token falls back to KZ_GITHUB_TOKEN.
AUDIT_REPO_FULL_NAME = get_env('ETL_AUDIT_REPO_FULL_NAME', required=False)
AUDIT_REPO_BRANCH = get_env('ETL_AUDIT_REPO_BRANCH', 'main', required=False)
AUDIT_REPO_TOKEN = get_env('ETL_AUDIT_REPO_TOKEN', required=False) or get_env('KZ_GITHUB_TOKEN', required=False)


EMAIL_NOTIFIER_SENDER_EMAIL = get_env('EMAIL_NOTIFIER_SENDER_EMAIL')
EMAIL_NOTIFIER_PASSWORD = get_env('EMAIL_NOTIFIER_PASSWORD')
EMAIL_NOTIFIER_RECIPIENT_LIST = get_env('EMAIL_NOTIFIER_RECIPIENT_LIST',[],strategy=s.ARRAY)
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587
