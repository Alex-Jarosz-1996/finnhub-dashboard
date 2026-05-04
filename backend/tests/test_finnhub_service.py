import pytest

from services import finnhub_service
from services.finnhub_service import FinnhubRateLimitError, _call_with_retry
from tests.conftest import MOCK_BASIC_FINANCIALS, MOCK_FINANCIALS_REPORTED, MOCK_QUOTE

# --- build_metrics ---


def test_build_metrics_extracts_plain_metric_fields(mocker):
    mocker.patch(
        "services.finnhub_service.get_basic_financials",
        return_value=MOCK_BASIC_FINANCIALS,
    )

    metrics = finnhub_service.build_metrics("AAPL")

    assert metrics["valuation"]["52WeekHigh"] == 199.62
    assert metrics["valuation"]["52WeekLow"] == 164.08
    assert metrics["valuation"]["marketCap"] == 2950000.0
    assert metrics["margins"]["grossMarginTTM"] == 45.96


def test_build_metrics_extracts_series_fields_as_value_and_date(mocker):
    mocker.patch(
        "services.finnhub_service.get_basic_financials",
        return_value=MOCK_BASIC_FINANCIALS,
    )

    metrics = finnhub_service.build_metrics("AAPL")

    assert metrics["valuation"]["peTTM"] == {"value": 28.4, "asOf": "2024-09-28"}


def test_build_metrics_returns_none_for_missing_series(mocker):
    empty = {"metric": {}, "series": {"quarterly": {}}}
    mocker.patch("services.finnhub_service.get_basic_financials", return_value=empty)

    metrics = finnhub_service.build_metrics("AAPL")

    assert metrics["valuation"]["peTTM"] is None
    assert metrics["returns"]["roeTTM"] is None


# --- build_reported ---


def test_build_reported_maps_bs_ic_cf(mocker):
    mocker.patch(
        "services.finnhub_service.get_financials_reported",
        return_value=MOCK_FINANCIALS_REPORTED,
    )

    reported = finnhub_service.build_reported("AAPL")

    assert reported["balanceSheet"][0]["label"] == "Total Assets"
    assert reported["incomeStatement"][0]["label"] == "Gross Profit"
    assert reported["cashFlowStatement"][0]["label"] == "Net Income"


def test_build_reported_returns_empty_lists_when_no_data(mocker):
    mocker.patch(
        "services.finnhub_service.get_financials_reported", return_value={"data": []}
    )

    reported = finnhub_service.build_reported("AAPL")

    assert reported == {
        "balanceSheet": [],
        "incomeStatement": [],
        "cashFlowStatement": [],
    }


# --- _call_with_retry ---


def test_call_with_retry_returns_result_on_success():
    result = _call_with_retry(lambda: {"data": "ok"})
    assert result == {"data": "ok"}


def test_call_with_retry_retries_on_429_and_succeeds(mocker):
    mocker.patch("services.finnhub_service.time.sleep")
    call_count = 0

    def fn():
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise Exception("429 Too Many Requests")
        return {"data": "ok"}

    result = _call_with_retry(fn)

    assert result == {"data": "ok"}
    assert call_count == 2
    finnhub_service.time.sleep.assert_called_once_with(1)


def test_call_with_retry_raises_rate_limit_error_after_two_429s(mocker):
    mocker.patch("services.finnhub_service.time.sleep")

    with pytest.raises(FinnhubRateLimitError):
        _call_with_retry(
            lambda: (_ for _ in ()).throw(Exception("429 Too Many Requests"))
        )


def test_call_with_retry_does_not_retry_non_429_exceptions(mocker):
    sleep_mock = mocker.patch("services.finnhub_service.time.sleep")
    call_count = 0

    def fn():
        nonlocal call_count
        call_count += 1
        raise Exception("Connection refused")

    with pytest.raises(Exception, match="Connection refused"):
        _call_with_retry(fn)

    assert call_count == 1
    sleep_mock.assert_not_called()


def test_call_with_retry_reraises_non_429_from_second_call(mocker):
    mocker.patch("services.finnhub_service.time.sleep")
    call_count = 0

    def fn():
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise Exception("429 Too Many Requests")
        raise Exception("Server error on retry")

    with pytest.raises(Exception, match="Server error on retry"):
        _call_with_retry(fn)

    assert call_count == 2


def test_get_quote_uppercases_symbol(mocker):
    mock_call = mocker.patch.object(
        finnhub_service._client, "quote", return_value=MOCK_QUOTE
    )

    finnhub_service.get_quote("aapl")

    mock_call.assert_called_once_with(symbol="AAPL")


def test_get_basic_financials_uppercases_symbol(mocker):
    mock_call = mocker.patch.object(
        finnhub_service._client,
        "company_basic_financials",
        return_value=MOCK_BASIC_FINANCIALS,
    )

    finnhub_service.get_basic_financials("aapl")

    mock_call.assert_called_once_with(symbol="AAPL", metric="all")


def test_get_financials_reported_uppercases_symbol(mocker):
    mock_call = mocker.patch.object(
        finnhub_service._client,
        "financials_reported",
        return_value=MOCK_FINANCIALS_REPORTED,
    )

    finnhub_service.get_financials_reported("aapl")

    mock_call.assert_called_once_with(symbol="AAPL", freq="annual")
