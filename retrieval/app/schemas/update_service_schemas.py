from pydantic import BaseModel, ConfigDict, Field


class UpdateServiceRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    service_id: str = Field(alias='serviceId')


class UpdateServiceResponse(BaseModel):
    service_id: str
    status: str
    embedded_text: str
    context_text: str = ''
