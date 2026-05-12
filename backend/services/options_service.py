import itertools
import os

from dotenv import load_dotenv
from massive import RESTClient

load_dotenv()

_API_KEY = os.getenv("MASSIVE_API_KEY")
if not _API_KEY:
    raise RuntimeError("MASSIVE_API_KEY is not set. Add it to backend/.env")

_client = RESTClient(_API_KEY)
_LIMIT = 50


class OptionsRateLimitError(Exception):
    pass


def _fetch(underlying_ticker: str, contract_type: str) -> list[dict]:
    try:
        contracts = list(
            itertools.islice(
                _client.list_options_contracts(
                    underlying_ticker=underlying_ticker,
                    contract_type=contract_type,
                    expired=False,
                    limit=_LIMIT,
                ),
                _LIMIT,
            )
        )
    except Exception as e:
        if "429" in str(e):
            raise OptionsRateLimitError("Massive rate limit exceeded") from e
        raise
    return [
        {"ticker": c.ticker, "expiration_date": c.expiration_date} for c in contracts
    ]


def get_options_chain(symbol: str) -> dict:
    calls = _fetch(symbol, "call")
    puts = _fetch(symbol, "put")
    return {"symbol": symbol, "calls": calls, "puts": puts}
