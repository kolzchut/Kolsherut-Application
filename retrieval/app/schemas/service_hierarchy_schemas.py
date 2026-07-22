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
