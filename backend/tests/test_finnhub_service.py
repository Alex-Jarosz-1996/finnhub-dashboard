import pytest

import finnhub_service
from cache import cache
from tests.conftest import MOCK_BASIC_FINANCIALS, MOCK_FINANCIALS_REPORTED, MOCK_QUOTE


@pytest.fixture(autouse=True)
def clear_cache():
    """
    Clear the TTL cache before every test so cached values don't bleed between tests.
    """
    cache.clear()
    yield
    cache.clear()


# --- build_metrics ---


def test_build_metrics_extracts_plain_metric_fields(mocker):
    mocker.patch(
        "finnhub_service.get_basic_financials", return_value=MOCK_BASIC_FINANCIALS
    )

    metrics = finnhub_service.build_metrics("AAPL")

    assert metrics["valuation"]["52WeekHigh"] == 199.62
    assert metrics["valuation"]["52WeekLow"] == 164.08
    assert metrics["valuation"]["marketCap"] == 2950000.0
    assert metrics["margins"]["grossMarginTTM"] == 45.96


def test_build_metrics_extracts_series_fields_as_value_and_date(mocker):
    mocker.patch(
        "finnhub_service.get_basic_financials", return_value=MOCK_BASIC_FINANCIALS
    )

    metrics = finnhub_service.build_metrics("AAPL")

    assert metrics["valuation"]["peTTM"] == {"value": 28.4, "asOf": "2024-09-28"}


def test_build_metrics_returns_none_for_missing_series(mocker):
    empty = {"metric": {}, "series": {"quarterly": {}}}
    mocker.patch("finnhub_service.get_basic_financials", return_value=empty)

    metrics = finnhub_service.build_metrics("AAPL")

    assert metrics["valuation"]["peTTM"] is None
    assert metrics["returns"]["roeTTM"] is None


# --- build_reported ---


def test_build_reported_maps_bs_ic_cf(mocker):
    mocker.patch(
        "finnhub_service.get_financials_reported", return_value=MOCK_FINANCIALS_REPORTED
    )

    reported = finnhub_service.build_reported("AAPL")

    assert reported["balanceSheet"][0]["label"] == "Total Assets"
    assert reported["incomeStatement"][0]["label"] == "Gross Profit"
    assert reported["cashFlowStatement"][0]["label"] == "Net Income"


def test_build_reported_returns_empty_lists_when_no_data(mocker):
    mocker.patch("finnhub_service.get_financials_reported", return_value={"data": []})

    reported = finnhub_service.build_reported("AAPL")

    assert reported == {
        "balanceSheet": [],
        "incomeStatement": [],
        "cashFlowStatement": [],
    }


# --- caching ---


def test_get_quote_caches_result(mocker):
    mock_call = mocker.patch.object(
        finnhub_service._client, "quote", return_value=MOCK_QUOTE
    )

    finnhub_service.get_quote("AAPL")
    finnhub_service.get_quote("AAPL")

    mock_call.assert_called_once()


def test_get_quote_cache_is_case_insensitive(mocker):
    mock_call = mocker.patch.object(
        finnhub_service._client, "quote", return_value=MOCK_QUOTE
    )

    finnhub_service.get_quote("aapl")
    finnhub_service.get_quote("AAPL")

    mock_call.assert_called_once()
