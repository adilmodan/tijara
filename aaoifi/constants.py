"""AAOIFI Shari'ah Standards constants and thresholds."""

# --- Nisab (Zakah eligibility thresholds) per SS (35) ---
GOLD_NISAB_GRAMS: float = 85.0
SILVER_NISAB_GRAMS: float = 595.0

# --- Quantitative screening thresholds per SS (21) ---
DEBT_THRESHOLD: float = 0.30
INTEREST_DEPOSIT_THRESHOLD: float = 0.30
PROHIBITED_INCOME_CAP: float = 0.05
MIN_TANGIBILITY: float = 0.30

# --- Zakah rates per SS (35) and SS (50) ---
ZAKAH_RATE_BUSINESS: float = 0.025       # 2.5% on trade/business assets
ZAKAH_RATE_RAIN_FED: float = 0.10        # 10% on rain-fed/natural irrigation
ZAKAH_RATE_MECHANICAL: float = 0.05      # 5% on mechanical/artificial irrigation

# --- Qualitative screening: prohibited sectors per SS (21) ---
PROHIBITED_SECTOR_KEYWORDS: set[str] = {
    # Conventional finance (Riba)
    "bank", "banking", "insurance", "mortgage", "lending",
    "credit", "consumer finance", "asset management",
    "capital markets", "financial services",
    # Liquor / Alcohol
    "alcohol", "liquor", "beer", "wine", "spirits",
    "distiller", "brewer", "brewery", "winery",
    # Pork-related
    "pork", "swine", "ham", "bacon",
    # Gambling
    "casino", "gambling", "gaming", "lottery", "betting",
    "slot", "wagering",
}

# Keywords that indicate conventional finance even when sector name is generic
PROHIBITED_INDUSTRY_KEYWORDS: set[str] = {
    "banks", "diversified banks", "regional banks",
    "thrifts & mortgage finance",
    "consumer finance", "asset management & custody banks",
    "investment banking & brokerage",
    "insurance", "life & health insurance",
    "property & casualty insurance", "reinsurance",
    "multi-line insurance",
    "brewers", "distillers & vintners",
    "casinos & gaming",
    "tobacco",
}
