from openlocationcode import openlocationcode as olc

from srm_tools.logger import logger

LANGUAGES_BY_NUMBER = ['hebrew', 'arabic', 'russian', 'french', 'english', 'amharic', 'spanish']


def replace_language_number_with_actual_value(language_number):
    try:
        language_index = int(language_number) - 1
        if language_index >= len(LANGUAGES_BY_NUMBER) or language_index < 0:
            return 'other'
        return LANGUAGES_BY_NUMBER[language_index]
    except Exception as error:
        logger.warning(f'Failed to parse language number {language_number}: {error}')
    return 'other'


def build_language_situations(language_value):
    return [
        f'human_situations:language:{replace_language_number_with_actual_value(lang.lower().strip())}_speaking'
        for lang in language_value.split(';') if lang != 8 and lang != '8'
    ]


def calc_address(branch):
    key = ''
    city_name = branch.get('cityName')
    if city_name:
        city_name = city_name.replace(' תאי דואר', '')
        street_name = branch.get('streetName')
        if street_name:
            key += f'{street_name} '
            house_num = branch.get('houseNum')
            if house_num:
                key += f'{house_num} '
            key += ', '
        key += f'{city_name} '
    alternate_address = branch.get('alternateAddress')
    if alternate_address and alternate_address != 'ללא כתובת':
        if alternate_address not in key:
            key += f' - {alternate_address}'
    return key.strip() or None


def calc_location_key(branch, address):
    latitude, longitude = branch.get('latitude'), branch.get('longitude')
    code = olc.encode(latitude, longitude, 11) if latitude and longitude else None
    return code or address
