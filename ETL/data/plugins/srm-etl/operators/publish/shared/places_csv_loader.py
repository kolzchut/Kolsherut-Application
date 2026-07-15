"""Single loader for the static places.csv (legacy loaded it twice - quirk #7)."""
import csv
import json
import os

STATIC_PLACES_CSV_PATH = os.path.join(
    os.path.dirname(__file__), '..', 'static_data', 'place_data', 'data', 'places.csv',
)


def load_places():
    places = []
    with open(STATIC_PLACES_CSV_PATH, 'r', encoding='utf-8') as places_file:
        for row in csv.DictReader(places_file):
            row['name'] = json.loads(row['name'])
            row['bounds'] = json.loads(row['bounds'])
            row['score'] = float(row['score'])
            places.append(row)
    return places
