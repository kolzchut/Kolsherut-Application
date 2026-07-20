from pydantic import BaseModel, ConfigDict, Field


class UpdateCardRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    card_id: str = Field(alias='cardId')


class UpdateCardResponse(BaseModel):
    card_id: str
    status: str
    embedded_text: str
    context_text: str = ''
