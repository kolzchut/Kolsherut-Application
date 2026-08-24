"""Composition of the per-card presentation fields (legacy card_data_flow tail)."""
from .address_fields import address_parts
from .geo_fields import add_geo_fields
from .organization_name_fields import add_organization_name_fields
from .possible_autocomplete import possible_autocomplete


def add_presentation_fields(card):
    card = add_geo_fields({**card, 'possible_autocomplete': possible_autocomplete(card)})
    card = {
        **card,
        'collapse_key': f"{card['service_name']} {card['service_description'] or ''}".strip(),
        'address_parts': address_parts(card),
    }
    return add_organization_name_fields(card)
