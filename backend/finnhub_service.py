import os
import time

import finnhub
from dotenv import load_dotenv

from cache import cache


class FinnhubRateLimitError(Exception):
    pass


def _call_with_retry(fn):
    try:
        return fn()
    except Exception as e:
        if "429" in str(e):
            time.sleep(1)
            try:
                return fn()
            except Exception as e2:
                if "429" in str(e2):
                    raise FinnhubRateLimitError("Finnhub rate limit exceeded") from e2
                raise
        raise


load_dotenv()

API_KEY = os.getenv("FINNHUB_API_KEY")
if not API_KEY:
    raise RuntimeError("FINNHUB_API_KEY is not set. Add it to backend/.env")

_client = finnhub.Client(api_key=API_KEY)


def get_quote(symbol: str) -> dict:
    key = ("quote", symbol.upper())
    if key not in cache:
        cache[key] = _call_with_retry(lambda: _client.quote(symbol=symbol.upper()))
    return cache[key]


def get_basic_financials(symbol: str) -> dict:
    key = ("basic_financials", symbol.upper())
    if key not in cache:
        cache[key] = _call_with_retry(
            lambda: _client.company_basic_financials(
                symbol=symbol.upper(), metric="all"
            )
        )
    return cache[key]


def get_financials_reported(symbol: str) -> dict:
    key = ("financials_reported", symbol.upper())
    if key not in cache:
        cache[key] = _call_with_retry(
            lambda: _client.financials_reported(symbol=symbol.upper(), freq="annual")
        )
    return cache[key]


def build_metrics(symbol: str) -> dict:
    raw = get_basic_financials(symbol)
    metric = raw.get("metric", {})
    series_q = raw.get("series", {}).get("quarterly", {})

    def latest(key: str):
        entries = series_q.get(key)
        if entries:
            return {"value": entries[0].get("v"), "asOf": entries[0].get("period")}
        return None

    return {
        "valuation": {
            "52WeekHigh": metric.get("52WeekHigh"),
            "52WeekLow": metric.get("52WeekLow"),
            "marketCap": metric.get("marketCapitalization"),
            "dividendYieldTTM": metric.get("currentDividendYieldTTM"),
            "dividendPerShareTTM": metric.get("dividendPerShareTTM"),
            "epsGrowthTTMYoy": metric.get("epsGrowthTTMYoy"),
            "peTTM": latest("peTTM"),
            "psTTM": latest("psTTM"),
            "pb": latest("pb"),
            "eps": latest("eps"),
        },
        "returns": {
            "roaTTM": latest("roaTTM"),
            "roeTTM": latest("roeTTM"),
            "roicTTM": latest("roicTTM"),
            "rotcTTM": latest("rotcTTM"),
        },
        "margins": {
            "grossMarginTTM": metric.get("grossMarginTTM"),
            "netProfitMarginTTM": metric.get("netProfitMarginTTM"),
            "operatingMarginTTM": metric.get("operatingMarginTTM"),
            "pretaxMarginTTM": metric.get("pretaxMarginTTM"),
        },
        "ratios": {
            "currentRatio": latest("currentRatio"),
            "quickRatio": latest("quickRatio"),
        },
        "debt": {
            "totalDebtToEquity": latest("totalDebtToEquity"),
            "totalDebtToTotalAsset": latest("totalDebtToTotalAsset"),
            "totalDebtToTotalCapital": latest("totalDebtToTotalCapital"),
        },
        "equity": {
            "bookValue": latest("bookValue"),
            "ebitPerShare": latest("ebitPerShare"),
            "ebitdPerShareTTM": metric.get("ebitdPerShareTTM"),
            "bookValuePerShareAnnual": metric.get("bookValuePerShareAnnual"),
            "cashPerShareAnnual": metric.get("cashPerSharePerShareAnnual"),
        },
        "ev": {
            "enterpriseValue": metric.get("enterpriseValue"),
            "evEbitdaTTM": latest("evEbitdaTTM"),
            "evRevenueTTM": latest("evRevenueTTM"),
            "evFreeCashFlowTTM": metric.get("currentEv/freeCashFlowTTM"),
        },
        "cashFlow": {
            "cashFlowPerShareAnnual": metric.get("cashFlowPerShareAnnual"),
            "fcfPerShareTTM": latest("fcfPerShareTTM"),
            "pfcfTTM": latest("pfcfTTM"),
            "pcfShareTTM": metric.get("pcfShareTTM"),
            "pfcfShareTTM": metric.get("pfcfShareTTM"),
        },
    }


def build_reported(symbol: str) -> dict:
    raw = get_financials_reported(symbol)
    data = raw.get("data", [])
    if not data:
        return {"balanceSheet": [], "incomeStatement": [], "cashFlowStatement": []}
    report = data[0].get("report", {})
    return {
        "balanceSheet": report.get("bs", []),
        "incomeStatement": report.get("ic", []),
        "cashFlowStatement": report.get("cf", []),
    }
