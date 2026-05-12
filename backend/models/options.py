from pydantic import BaseModel


class OptionsContract(BaseModel):
    ticker: str
    expiration_date: str


class OptionsChainResponse(BaseModel):
    symbol: str
    calls: list[OptionsContract]
    puts: list[OptionsContract]
