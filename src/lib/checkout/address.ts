/**
 * Shipping address rules for supported storefront markets.
 * Keep in sync with backend/app/application/checkout/address.py
 */

export type ShipCountry = "US" | "CA" | "GB" | "DE";

export type AddressField =
  | "fullName"
  | "line1"
  | "city"
  | "region"
  | "postal"
  | "country";

export type AddressInput = {
  fullName: string;
  line1: string;
  city: string;
  region: string;
  postal: string;
  country: ShipCountry | string;
};

export type AddressErrors = Partial<Record<AddressField, string>>;

export type CountryMeta = {
  code: ShipCountry;
  label: string;
  regionLabel: string;
  postalLabel: string;
  regionPlaceholder: string;
  postalPlaceholder: string;
  /** When true, region is a fixed select list */
  regionMode: "select" | "text" | "optional_text";
};

export const SHIP_COUNTRIES: CountryMeta[] = [
  {
    code: "US",
    label: "United States",
    regionLabel: "State",
    postalLabel: "ZIP code",
    regionPlaceholder: "Select state",
    postalPlaceholder: "94105",
    regionMode: "select",
  },
  {
    code: "CA",
    label: "Canada",
    regionLabel: "Province",
    postalLabel: "Postal code",
    regionPlaceholder: "Select province",
    postalPlaceholder: "K1A 0B1",
    regionMode: "select",
  },
  {
    code: "GB",
    label: "United Kingdom",
    regionLabel: "County",
    postalLabel: "Postcode",
    regionPlaceholder: "e.g. Greater London",
    postalPlaceholder: "SW1A 1AA",
    regionMode: "optional_text",
  },
  {
    code: "DE",
    label: "Germany",
    regionLabel: "State",
    postalLabel: "Postcode",
    regionPlaceholder: "Select state",
    postalPlaceholder: "10115",
    regionMode: "select",
  },
];

export const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

export const CA_PROVINCES: { code: string; name: string }[] = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" },
];

export const DE_STATES: { code: string; name: string }[] = [
  { code: "BW", name: "Baden-Württemberg" },
  { code: "BY", name: "Bavaria" },
  { code: "BE", name: "Berlin" },
  { code: "BB", name: "Brandenburg" },
  { code: "HB", name: "Bremen" },
  { code: "HH", name: "Hamburg" },
  { code: "HE", name: "Hesse" },
  { code: "MV", name: "Mecklenburg-Vorpommern" },
  { code: "NI", name: "Lower Saxony" },
  { code: "NW", name: "North Rhine-Westphalia" },
  { code: "RP", name: "Rhineland-Palatinate" },
  { code: "SL", name: "Saarland" },
  { code: "SN", name: "Saxony" },
  { code: "ST", name: "Saxony-Anhalt" },
  { code: "SH", name: "Schleswig-Holstein" },
  { code: "TH", name: "Thuringia" },
];

const US_STATE_SET = new Set(US_STATES.map((s) => s.code));
const CA_PROV_SET = new Set(CA_PROVINCES.map((s) => s.code));
const DE_STATE_SET = new Set(DE_STATES.map((s) => s.code));

const SUPPORTED = new Set<string>(["US", "CA", "GB", "DE"]);

/** UK outward+inward postcode (common forms). */
const GB_POSTAL =
  /^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i;

const CA_POSTAL = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d$/i;

export function isShipCountry(value: string): value is ShipCountry {
  return SUPPORTED.has(value.toUpperCase());
}

export function getCountryMeta(code: string): CountryMeta {
  const c = code.toUpperCase();
  return (
    SHIP_COUNTRIES.find((x) => x.code === c) ??
    SHIP_COUNTRIES[0]!
  );
}

export function regionOptions(country: string): { code: string; name: string }[] {
  switch (country.toUpperCase()) {
    case "US":
      return US_STATES;
    case "CA":
      return CA_PROVINCES;
    case "DE":
      return DE_STATES;
    default:
      return [];
  }
}

export function normalizePostal(country: string, postal: string): string {
  const raw = postal.trim().toUpperCase().replace(/\s+/g, " ");
  const c = country.toUpperCase();
  if (c === "CA" && raw.length === 6 && !raw.includes(" ")) {
    return `${raw.slice(0, 3)} ${raw.slice(3)}`;
  }
  if (c === "GB") {
    const compact = raw.replace(/\s+/g, "");
    if (compact.length >= 5) {
      return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
    }
  }
  if (c === "US") {
    return raw.replace(/[^\d-]/g, "");
  }
  if (c === "DE") {
    return raw.replace(/\D/g, "").slice(0, 5);
  }
  return raw;
}

export function normalizeRegion(country: string, region: string): string {
  const c = country.toUpperCase();
  const r = region.trim();
  if (c === "US" || c === "CA" || c === "DE") {
    return r.toUpperCase();
  }
  return r;
}

function validatePostal(country: string, postal: string): string | null {
  const p = normalizePostal(country, postal);
  if (!p) return "Enter a postal code";
  switch (country.toUpperCase()) {
    case "US":
      if (!/^\d{5}(-\d{4})?$/.test(p)) {
        return "Use a 5-digit ZIP (or ZIP+4)";
      }
      return null;
    case "CA":
      if (!CA_POSTAL.test(p)) {
        return "Use a Canadian postal code (e.g. K1A 0B1)";
      }
      return null;
    case "GB":
      if (!GB_POSTAL.test(p)) {
        return "Use a valid UK postcode (e.g. SW1A 1AA)";
      }
      return null;
    case "DE":
      if (!/^\d{5}$/.test(p)) {
        return "Use a 5-digit German postcode";
      }
      return null;
    default:
      return "Unsupported country";
  }
}

function validateRegion(country: string, region: string): string | null {
  const c = country.toUpperCase();
  const r = normalizeRegion(c, region);
  if (c === "GB") {
    // County optional for UK; if provided, keep reasonable length
    if (r && (r.length < 2 || r.length > 64)) {
      return "Enter a valid county (or leave blank)";
    }
    return null;
  }
  if (!r) {
    const meta = getCountryMeta(c);
    return `${meta.regionLabel} is required`;
  }
  if (c === "US" && !US_STATE_SET.has(r)) {
    return "Select a valid US state";
  }
  if (c === "CA" && !CA_PROV_SET.has(r)) {
    return "Select a valid province/territory";
  }
  if (c === "DE" && !DE_STATE_SET.has(r)) {
    return "Select a German state";
  }
  return null;
}

/**
 * Full shipping form validation. Returns field → message map (empty if ok).
 */
export function validateShippingAddress(input: AddressInput): AddressErrors {
  const errors: AddressErrors = {};
  const country = (input.country || "US").trim().toUpperCase();

  if (!isShipCountry(country)) {
    errors.country = "We currently ship to US, UK, Canada, and Germany";
  }

  const name = input.fullName.trim();
  if (name.length < 2) {
    errors.fullName = "Enter your full name";
  } else if (name.length > 255) {
    errors.fullName = "Name is too long";
  } else if (!/[\p{L}]/u.test(name)) {
    errors.fullName = "Name must include letters";
  }

  const line1 = input.line1.trim();
  if (line1.length < 5) {
    errors.line1 = "Enter a full street address";
  } else if (line1.length > 255) {
    errors.line1 = "Address is too long";
  } else if (!/[\p{L}\d]/u.test(line1)) {
    errors.line1 = "Enter a valid street address";
  }

  const city = input.city.trim();
  if (city.length < 2) {
    errors.city = "Enter a city";
  } else if (city.length > 128) {
    errors.city = "City is too long";
  } else if (!/[\p{L}]/u.test(city)) {
    errors.city = "City must include letters";
  }

  if (!errors.country) {
    const regionErr = validateRegion(country, input.region);
    if (regionErr) errors.region = regionErr;

    const postalErr = validatePostal(country, input.postal);
    if (postalErr) errors.postal = postalErr;
  }

  return errors;
}

/** Normalize for API payload after client validation passed. */
export function normalizeShippingAddress(input: AddressInput): {
  fullName: string;
  line1: string;
  city: string;
  region: string;
  postal: string;
  country: ShipCountry;
} {
  const country = (input.country || "US").trim().toUpperCase() as ShipCountry;
  let region = normalizeRegion(country, input.region);
  // UK county optional — persist city when blank so carriers always have a region field
  if (country === "GB" && !region) {
    region = input.city.trim();
  }
  return {
    fullName: input.fullName.trim().replace(/\s+/g, " "),
    line1: input.line1.trim().replace(/\s+/g, " "),
    city: input.city.trim().replace(/\s+/g, " "),
    region,
    postal: normalizePostal(country, input.postal),
    country,
  };
}
