"""Unit tests for multi-country shipping address validation."""

import pytest

from app.application.checkout.address import (
    AddressValidationError,
    validate_and_normalize_shipping,
)


def _ok(**kwargs: str) -> dict[str, str]:
    base = {
        "full_name": "Jane Doe",
        "line1": "123 Market Street",
        "city": "San Francisco",
        "region": "CA",
        "postal": "94105",
        "country": "US",
    }
    base.update(kwargs)
    return base


def test_us_valid_zip_plus4() -> None:
    n = validate_and_normalize_shipping(**_ok(postal="94105-1234"))
    assert n.postal == "94105-1234"
    assert n.country == "US"
    assert n.region == "CA"


def test_us_rejects_bad_zip() -> None:
    with pytest.raises(AddressValidationError) as ei:
        validate_and_normalize_shipping(**_ok(postal="ABC"))
    assert ei.value.field == "postal"


def test_us_rejects_bad_state() -> None:
    with pytest.raises(AddressValidationError) as ei:
        validate_and_normalize_shipping(**_ok(region="ZZ"))
    assert ei.value.field == "region"


def test_ca_normalizes_postal() -> None:
    n = validate_and_normalize_shipping(
        **_ok(
            city="Ottawa",
            region="ON",
            postal="k1a0b1",
            country="CA",
            line1="80 Wellington Street",
        )
    )
    assert n.postal == "K1A 0B1"
    assert n.region == "ON"


def test_gb_postcode_and_optional_county() -> None:
    n = validate_and_normalize_shipping(
        full_name="Alex Smith",
        line1="10 Downing Street",
        city="London",
        region="",
        postal="sw1a1aa",
        country="GB",
    )
    assert n.postal == "SW1A 1AA"
    assert n.region == "London"  # falls back to city


def test_de_plz() -> None:
    n = validate_and_normalize_shipping(
        full_name="Hans Müller",
        line1="Unter den Linden 1",
        city="Berlin",
        region="be",
        postal="10115",
        country="DE",
    )
    assert n.region == "BE"
    assert n.postal == "10115"


def test_unsupported_country() -> None:
    with pytest.raises(AddressValidationError) as ei:
        validate_and_normalize_shipping(**_ok(country="BR"))
    assert ei.value.field == "country"


def test_short_street_rejected() -> None:
    with pytest.raises(AddressValidationError) as ei:
        validate_and_normalize_shipping(**_ok(line1="12"))
    assert ei.value.field == "line1"
