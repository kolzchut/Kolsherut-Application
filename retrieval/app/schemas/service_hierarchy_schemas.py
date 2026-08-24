from typing import Optional

from pydantic import BaseModel


class Tag(BaseModel):
    id: str
    name: Optional[str] = None
    synonyms: list[str] = []


class AddressParts(BaseModel):
    primary: Optional[str] = None
    secondary: Optional[str] = None


class Branch(BaseModel):
    id: str
    name: Optional[str] = None
    address: Optional[str] = None
    address_parts: Optional[AddressParts] = None
    branch_operating_unit: Optional[str] = None
    isNational: Optional[bool] = None
    isAccurate: Optional[bool] = None
    geometry: Optional[list[float]] = None
    responses: list[Tag] = []
    situations: list[Tag] = []


class Organization(BaseModel):
    id: str
    name: Optional[str] = None
    branches: list[Branch] = []


class Service(BaseModel):
    id: str
    service_name: Optional[str] = None
    service_description: Optional[str] = None
    responses: list[Tag] = []
    situations: list[Tag] = []
    organizations: list[Organization] = []
    organization_kind: str = ''
    organization_phone_numbers: list[str] = []
    service_phone_numbers: list[str] = []
    # Scores of the retrieved document that won this service_name in the rank collapse,
    # copied verbatim from documents[] by order_services_by_ranking. retrieval_score is the
    # fused RRF score - deliberately not named 'score', which the cards mapper already uses
    # for the card's static boost. None means that retriever never surfaced the document,
    # which is not the same as scoring it zero, so nothing here is ever defaulted to 0.0.
    retrieval_score: Optional[float] = None
    semantic_score: Optional[float] = None
    lexical_score: Optional[float] = None
    cosine_score: Optional[float] = None
    cosine_score_ratio: Optional[float] = None
