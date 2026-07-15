from dataclasses import dataclass, field


@dataclass
class PipelineData:
    """Everything the downstream stages consume. Replaces the legacy data/ folder entirely.

    snapshot     - preprocessed main-base tables, keyed by table name
                   (responses, situations, organizations, locations, branches, services)
    cards        - the built card rows, one per (service, branch) pair, keyed by card_id
    autocomplete - the generated autocomplete query rows
    """

    snapshot: dict = field(default_factory=dict)
    cards: list = field(default_factory=list)
    autocomplete: list = field(default_factory=list)
