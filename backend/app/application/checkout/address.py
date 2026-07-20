"""Shipping address validation for supported markets (US, CA, GB, DE).

Keep rules aligned with src/lib/checkout/address.ts
"""

from __future__ import annotations

import re
from dataclasses import dataclass

SUPPORTED_COUNTRIES = frozenset({"US", "CA", "GB", "DE"})

US_STATES = frozenset(
    {
        "AL",
        "AK",
        "AZ",
        "AR",
        "CA",
        "CO",
        "CT",
        "DE",
        "DC",
        "FL",
        "GA",
        "HI",
        "ID",
        "IL",
        "IN",
        "IA",
        "KS",
        "KY",
        "LA",
        "ME",
        "MD",
        "MA",
        "MI",
        "MN",
        "MS",
        "MO",
        "MT",
        "NE",
        "NV",
        "NH",
        "NJ",
        "NM",
        "NY",
        "NC",
        "ND",
        "OH",
        "OK",
        "OR",
        "PA",
        "RI",
        "SC",
        "SD",
        "TN",
        "TX",
        "UT",
        "VT",
        "VA",
        "WA",
        "WV",
        "WI",
        "WY",
    }
)

CA_PROVINCES = frozenset(
    {
        "AB",
        "BC",
        "MB",
        "NB",
        "NL",
        "NS",
        "NT",
        "NU",
        "ON",
        "PE",
        "QC",
        "SK",
        "YT",
    }
)

DE_STATES = frozenset(
    {
        "BW",
        "BY",
        "BE",
        "BB",
        "HB",
        "HH",
        "HE",
        "MV",
        "NI",
        "NW",
        "RP",
        "SL",
        "SN",
        "ST",
        "SH",
        "TH",
    }
)

_GB_POSTAL = re.compile(
    r"^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$",
    re.IGNORECASE,
)
_CA_POSTAL = re.compile(
    r"^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d$",
    re.IGNORECASE,
)
# Unicode letters (no third-party regex dep)
_HAS_LETTER = re.compile(r"[^\W\d_]", re.UNICODE)
_HAS_LETTER_OR_DIGIT = re.compile(r"[^\W_]", re.UNICODE)


@dataclass(frozen=True)
class NormalizedShipping:
    full_name: str
    line1: str
    city: str
    region: str
    postal: str
    country: str


class AddressValidationError(Exception):
    def __init__(self, message: str, *, field: str = "shipping") -> None:
        super().__init__(message)
        self.message = message
        self.field = field


def normalize_postal(country: str, postal: str) -> str:
    raw = " ".join(postal.strip().upper().split())
    c = country.upper()
    if c == "CA" and len(raw) == 6 and " " not in raw:
        return f"{raw[:3]} {raw[3:]}"
    if c == "GB":
        compact = raw.replace(" ", "")
        if len(compact) >= 5:
            return f"{compact[:-3]} {compact[-3:]}"
    if c == "US":
        return re.sub(r"[^\d-]", "", raw)
    if c == "DE":
        return re.sub(r"\D", "", raw)[:5]
    return raw


def normalize_region(country: str, region: str) -> str:
    r = region.strip()
    if country.upper() in {"US", "CA", "DE"}:
        return r.upper()
    return r


def validate_and_normalize_shipping(
    *,
    full_name: str,
    line1: str,
    city: str,
    region: str,
    postal: str,
    country: str,
) -> NormalizedShipping:
    c = (country or "US").strip().upper()
    if c not in SUPPORTED_COUNTRIES:
        raise AddressValidationError(
            "We currently ship to the United States, United Kingdom, Canada, and Germany",
            field="country",
        )

    name = " ".join(full_name.strip().split())
    if len(name) < 2 or len(name) > 255:
        raise AddressValidationError("Enter your full name", field="fullName")
    if not _HAS_LETTER.search(name):
        raise AddressValidationError("Name must include letters", field="fullName")

    street = " ".join(line1.strip().split())
    if len(street) < 5 or len(street) > 255:
        raise AddressValidationError("Enter a full street address", field="line1")
    if not _HAS_LETTER_OR_DIGIT.search(street):
        raise AddressValidationError("Enter a valid street address", field="line1")

    city_n = " ".join(city.strip().split())
    if len(city_n) < 2 or len(city_n) > 128:
        raise AddressValidationError("Enter a city", field="city")
    if not _HAS_LETTER.search(city_n):
        raise AddressValidationError("City must include letters", field="city")

    reg = normalize_region(c, region)
    if c == "GB":
        if reg and (len(reg) < 2 or len(reg) > 64):
            raise AddressValidationError("Enter a valid county", field="region")
        if not reg:
            reg = city_n
    elif c == "US":
        if reg not in US_STATES:
            raise AddressValidationError("Select a valid US state", field="region")
    elif c == "CA":
        if reg not in CA_PROVINCES:
            raise AddressValidationError(
                "Select a valid province/territory",
                field="region",
            )
    elif c == "DE":
        if reg not in DE_STATES:
            raise AddressValidationError("Select a German state", field="region")
    else:
        if not reg:
            raise AddressValidationError("Region is required", field="region")

    post = normalize_postal(c, postal)
    if c == "US":
        if not re.fullmatch(r"\d{5}(-\d{4})?", post):
            raise AddressValidationError(
                "Use a 5-digit ZIP (or ZIP+4)",
                field="postal",
            )
    elif c == "CA":
        if not _CA_POSTAL.fullmatch(post):
            raise AddressValidationError(
                "Use a Canadian postal code (e.g. K1A 0B1)",
                field="postal",
            )
        post = normalize_postal("CA", post)
    elif c == "GB":
        if not _GB_POSTAL.fullmatch(post):
            raise AddressValidationError(
                "Use a valid UK postcode (e.g. SW1A 1AA)",
                field="postal",
            )
        post = normalize_postal("GB", post)
    elif c == "DE":
        if not re.fullmatch(r"\d{5}", post):
            raise AddressValidationError(
                "Use a 5-digit German postcode",
                field="postal",
            )

    return NormalizedShipping(
        full_name=name,
        line1=street,
        city=city_n,
        region=reg,
        postal=post,
        country=c,
    )
