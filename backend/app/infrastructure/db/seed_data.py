"""Catalog seed data — mirrors frontend mock fixtures (8 products, 4 categories)."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

CATEGORIES: list[dict[str, Any]] = [
    {
        "id": "cat_recovery",
        "slug": "recovery",
        "name": "Recovery",
        "description": (
            "Massage, heat, and tension relief that helps you reset after long days."
        ),
        "tagline": "Unwind tension. Move freer.",
        "image_url": (
            "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b"
            "?auto=format&fit=crop&w=1200&q=80"
        ),
        "cta_label": "Shop Recovery",
        "is_virtual": False,
        "sort_order": 1,
    },
    {
        "id": "cat_comfort",
        "slug": "comfort",
        "name": "Comfort",
        "description": (
            "Supportive cushions and wraps that make sitting and resting feel better."
        ),
        "tagline": "Soft support for real life.",
        "image_url": (
            "https://images.unsplash.com/photo-1616628182501-df42145cf54d"
            "?auto=format&fit=crop&w=1200&q=80"
        ),
        "cta_label": "Shop Comfort",
        "is_virtual": False,
        "sort_order": 2,
    },
    {
        "id": "cat_everyday",
        "slug": "everyday",
        "name": "Everyday",
        "description": (
            "Practical upgrades for work, home, and the routines in between."
        ),
        "tagline": "Small upgrades. Better days.",
        "image_url": (
            "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b"
            "?auto=format&fit=crop&w=1200&q=80"
        ),
        "cta_label": "Shop Everyday",
        "is_virtual": False,
        "sort_order": 3,
    },
    {
        "id": "cat_all",
        "slug": "all",
        "name": "All products",
        "description": "The full PuffyCalm collection of life-improving essentials.",
        "tagline": "Everything we love right now",
        "image_url": (
            "https://images.unsplash.com/photo-1600880292203-757bb62b4baf"
            "?auto=format&fit=crop&w=1200&q=80"
        ),
        "cta_label": "Shop All",
        "is_virtual": True,
        "sort_order": 0,
    },
]

# category_slugs exclude "all" — virtual collection is computed in the API layer
PRODUCTS: list[dict[str, Any]] = [
    {
        "id": "prod_001",
        "slug": "shiatsu-neck-shoulder-massager",
        "name": "Shiatsu Neck & Shoulder Massager",
        "short_description": (
            "Deep kneading massage with optional heat for desk-heavy days."
        ),
        "description": (
            "A premium shiatsu massager designed for desk-heavy days. Targets neck "
            "and shoulders with rhythmic kneading and gentle heat — so tension "
            "doesn't stack into tomorrow."
        ),
        "price": Decimal("54.00"),
        "compare_at_price": Decimal("69.00"),
        "currency": "USD",
        "category_slugs": ["recovery"],
        "category_label": "Recovery",
        "image_url": (
            "https://images.unsplash.com/photo-1544161515-4ab6ce6db874"
            "?auto=format&fit=crop&w=900&q=80"
        ),
        "images": [
            "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=900&q=80",
        ],
        "image_alt": "Person enjoying a calm neck massage ritual",
        "rating": Decimal("4.80"),
        "review_count": 214,
        "badges": ["bestseller", "sale"],
        "features": ["Shiatsu nodes", "Optional heat", "Hands-free design"],
        "specs": [
            {"label": "Therapy", "value": "Shiatsu kneading nodes with optional heat"},
            {"label": "Fit", "value": "Hands-free shoulder drape for desk sessions"},
            {"label": "Use", "value": "15–20 minute daily reset after screen time"},
            {"label": "Feel", "value": "Premium soft contact surfaces, quiet motor"},
        ],
        "in_stock": True,
        "featured": True,
    },
    {
        "id": "prod_002",
        "slug": "mini-massage-gun-premium",
        "name": "Mini Massage Gun",
        "short_description": (
            "Quiet percussion recovery that fits in your everyday bag."
        ),
        "description": (
            "Compact percussion therapy with a soft-touch body and whisper-quiet "
            "motor. Built for bags, travel days, and quick recovery between meetings."
        ),
        "price": Decimal("49.00"),
        "compare_at_price": None,
        "currency": "USD",
        "category_slugs": ["recovery"],
        "category_label": "Recovery",
        "image_url": (
            "https://images.unsplash.com/photo-1518611012118-696072aa579a"
            "?auto=format&fit=crop&w=900&q=80"
        ),
        "images": [
            "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
        ],
        "image_alt": "Active recovery with compact massage tools",
        "rating": Decimal("4.70"),
        "review_count": 168,
        "badges": ["bestseller"],
        "features": ["Portable size", "Multiple speeds", "USB-C charging"],
        "specs": [
            {"label": "Form", "value": "Pocket-friendly body, soft-touch grip"},
            {"label": "Power", "value": "Multiple speeds with quiet motor"},
            {"label": "Charge", "value": "USB-C for easy everyday charging"},
            {"label": "Travel", "value": "Light enough for carry-on recovery"},
        ],
        "in_stock": True,
        "featured": True,
    },
    {
        "id": "prod_003",
        "slug": "led-massage-gun",
        "name": "LED Display Massage Gun",
        "short_description": "Precision recovery with clear intensity control.",
        "description": (
            "A refined massage gun with an LED intensity display and balanced grip "
            "— precision recovery without the bulk of gym-only tools."
        ),
        "price": Decimal("55.00"),
        "compare_at_price": None,
        "currency": "USD",
        "category_slugs": ["recovery"],
        "category_label": "Recovery",
        "image_url": (
            "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b"
            "?auto=format&fit=crop&w=900&q=80"
        ),
        "images": [
            "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1599058945522-28d584b6f14f?auto=format&fit=crop&w=900&q=80",
        ],
        "image_alt": "Strength and recovery training lifestyle",
        "rating": Decimal("4.60"),
        "review_count": 97,
        "badges": ["new"],
        "features": ["LED display", "Ergonomic handle", "4 attachments"],
        "specs": [
            {"label": "Control", "value": "LED intensity display for clear levels"},
            {
                "label": "Grip",
                "value": "Ergonomic handle balanced for longer sessions",
            },
            {"label": "Kit", "value": "Four attachments for neck, back, and legs"},
            {"label": "Use", "value": "Pre-workout warm-up or post-desk release"},
        ],
        "in_stock": True,
        "featured": True,
    },
    {
        "id": "prod_004",
        "slug": "heated-eye-massager",
        "name": "Heated Eye Massager",
        "short_description": "Warm compression for tired, screen-heavy eyes.",
        "description": (
            "Soft heated eye therapy with gentle compression and calm vibration. "
            "Made for late screens, dry flights, and the 4pm eye strain you ignore."
        ),
        "price": Decimal("52.00"),
        "compare_at_price": Decimal("64.00"),
        "currency": "USD",
        "category_slugs": ["recovery", "comfort"],
        "category_label": "Comfort",
        "image_url": (
            "https://images.unsplash.com/photo-1506126613408-eca07ce68773"
            "?auto=format&fit=crop&w=900&q=80"
        ),
        "images": [
            "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=900&q=80",
        ],
        "image_alt": "Calm wellness rest and eye recovery",
        "rating": Decimal("4.90"),
        "review_count": 142,
        "badges": ["bestseller", "sale"],
        "features": ["Warm compress", "Soft blindfold fit", "Rechargeable"],
        "specs": [
            {"label": "Therapy", "value": "Warm compress with gentle compression"},
            {"label": "Fit", "value": "Soft blindfold contour, light-blocking"},
            {"label": "Power", "value": "Rechargeable for nightly wind-down"},
            {"label": "Ritual", "value": "10-minute reset after long screen blocks"},
        ],
        "in_stock": True,
        "featured": True,
    },
    {
        "id": "prod_005",
        "slug": "lumbar-support-cushion",
        "name": "Lumbar Support Cushion",
        "short_description": "Posture-friendly support for long work sessions.",
        "description": (
            "Memory-foam lumbar support that keeps your lower back comfortable "
            "through long work sessions — posture help that doesn't feel medical."
        ),
        "price": Decimal("39.00"),
        "compare_at_price": None,
        "currency": "USD",
        "category_slugs": ["comfort"],
        "category_label": "Comfort",
        "image_url": (
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7"
            "?auto=format&fit=crop&w=900&q=80"
        ),
        "images": [
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=900&q=80",
        ],
        "image_alt": "Minimal home office comfort setup",
        "rating": Decimal("4.50"),
        "review_count": 88,
        "badges": [],
        "features": ["Memory foam", "Adjustable strap", "Breathable cover"],
        "specs": [
            {"label": "Support", "value": "Contour memory foam for lower back"},
            {"label": "Fit", "value": "Adjustable strap for most office chairs"},
            {"label": "Cover", "value": "Breathable fabric for all-day sessions"},
            {"label": "Setup", "value": "Seconds to attach — no tools"},
        ],
        "in_stock": True,
        "featured": True,
    },
    {
        "id": "prod_006",
        "slug": "orthopedic-seat-cushion",
        "name": "Orthopedic Seat Cushion",
        "short_description": "Pressure-relief seating for home and office.",
        "description": (
            "An orthopedic seat cushion designed to reduce pressure during long "
            "hours at home or in the office — soft where you sit, stable where "
            "you need it."
        ),
        "price": Decimal("42.00"),
        "compare_at_price": None,
        "currency": "USD",
        "category_slugs": ["comfort"],
        "category_label": "Comfort",
        "image_url": (
            "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e"
            "?auto=format&fit=crop&w=900&q=80"
        ),
        "images": [
            "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1616628182501-df42145cf54d?auto=format&fit=crop&w=900&q=80",
        ],
        "image_alt": "Soft living room comfort seating",
        "rating": Decimal("4.60"),
        "review_count": 121,
        "badges": ["new"],
        "features": ["Pressure relief", "Non-slip base", "Machine-washable cover"],
        "specs": [
            {"label": "Comfort", "value": "Pressure-relief foam for long sits"},
            {"label": "Base", "value": "Non-slip underside for chair stability"},
            {"label": "Care", "value": "Machine-washable cover"},
            {"label": "Place", "value": "Home office, desk chair, or travel seat"},
        ],
        "in_stock": True,
        "featured": True,
    },
    {
        "id": "prod_007",
        "slug": "heated-neck-wrap",
        "name": "Heated Neck Wrap",
        "short_description": "Soft heat therapy for stiff necks and shoulders.",
        "description": (
            "A plush heated neck wrap that delivers steady warmth where tension "
            "collects — evening wind-down without a spa appointment."
        ),
        "price": Decimal("44.00"),
        "compare_at_price": Decimal("55.00"),
        "currency": "USD",
        "category_slugs": ["recovery", "comfort"],
        "category_label": "Recovery",
        "image_url": (
            "https://images.unsplash.com/photo-1515377905703-c4788e51af15"
            "?auto=format&fit=crop&w=900&q=80"
        ),
        "images": [
            "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80",
        ],
        "image_alt": "Warm spa-like self care moment",
        "rating": Decimal("4.70"),
        "review_count": 76,
        "badges": ["sale"],
        "features": ["Even heat zones", "Soft fabric", "Auto shut-off"],
        "specs": [
            {
                "label": "Heat",
                "value": "Even heat zones along neck and shoulders",
            },
            {"label": "Fabric", "value": "Plush soft surface against skin"},
            {"label": "Safety", "value": "Auto shut-off for unattended calm"},
            {"label": "Ritual", "value": "Couch, bed, or post-commute unwind"},
        ],
        "in_stock": True,
        "featured": False,
    },
    {
        "id": "prod_008",
        "slug": "aluminum-laptop-stand",
        "name": "Aluminum Laptop Stand",
        "short_description": "Elevate your setup. Improve your posture.",
        "description": (
            "A minimal aluminum laptop stand that raises your screen to a "
            "healthier height — cleaner desk lines, better neck posture, less "
            "slouch by 5pm."
        ),
        "price": Decimal("45.00"),
        "compare_at_price": None,
        "currency": "USD",
        "category_slugs": ["everyday"],
        "category_label": "Everyday",
        "image_url": (
            "https://images.unsplash.com/photo-1498050108023-c5249f4df085"
            "?auto=format&fit=crop&w=900&q=80"
        ),
        "images": [
            "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
        ],
        "image_alt": "Clean desk setup with elevated laptop",
        "rating": Decimal("4.80"),
        "review_count": 203,
        "badges": ["bestseller"],
        "features": ["Solid aluminum", "Ventilated design", "Foldable"],
        "specs": [
            {"label": "Material", "value": "Solid aluminum with clean edges"},
            {"label": "Cooling", "value": "Ventilated design for airflow"},
            {"label": "Portability", "value": "Folds flat for travel or storage"},
            {"label": "Fit", "value": 'Most 11–16" laptops'},
        ],
        "in_stock": True,
        "featured": True,
    },
]

# Base review seeds (same copy as frontend mock) — attached to every product
REVIEW_SEEDS: list[dict[str, Any]] = [
    {
        "author": "Maya Chen",
        "initials": "MC",
        "rating": 5,
        "title": "Finally something that doesn't feel clinical",
        "body": (
            "I tried two other massagers that looked medical and felt loud. "
            "This one sits in my living room without looking weird, and the heat "
            "after long screen days is the part I actually look forward to."
        ),
        "date_label": "Apr 2026",
        "created_at": "2026-04-12T10:00:00+00:00",
        "verified": True,
        "helpful": 42,
        "tags": ["Daily ritual", "Quiet"],
        "featured": True,
    },
    {
        "author": "Jordan Ellis",
        "initials": "JE",
        "rating": 5,
        "title": "Worth keeping on the desk",
        "body": (
            "I keep it draped on the chair. Fifteen minutes between calls and my "
            "shoulders stop climbing into my ears. Build quality feels premium "
            "without being flashy."
        ),
        "date_label": "Mar 2026",
        "created_at": "2026-03-28T14:00:00+00:00",
        "verified": True,
        "helpful": 31,
        "tags": ["Desk life"],
        "featured": False,
    },
    {
        "author": "Priya Nair",
        "initials": "PN",
        "rating": 4,
        "title": "Gentle but effective",
        "body": (
            "Not the aggressive gym-style tools — more of a calm reset. Heat is "
            "optional and I use it most evenings. Would love one more intensity "
            "notch for deeper knots."
        ),
        "date_label": "Mar 2026",
        "created_at": "2026-03-18T09:00:00+00:00",
        "verified": True,
        "helpful": 18,
        "tags": ["Evening wind-down"],
        "featured": False,
    },
    {
        "author": "Sam Ortiz",
        "initials": "SO",
        "rating": 5,
        "title": "Gifted it, then bought my own",
        "body": (
            "Sent one to my partner, used theirs once, ordered mine the next day. "
            "Packaging was thoughtful and the first session sold me completely."
        ),
        "date_label": "Feb 2026",
        "created_at": "2026-02-22T16:00:00+00:00",
        "verified": True,
        "helpful": 27,
        "tags": ["Gift", "Instant fan"],
        "featured": False,
    },
    {
        "author": "Alex Rivera",
        "initials": "AR",
        "rating": 4,
        "title": "Travels well, still feels solid",
        "body": (
            "Took it on two work trips. Packed flat enough, quiet enough for a "
            "hotel, and still feels like a real tool — not a gimmick gadget."
        ),
        "date_label": "Feb 2026",
        "created_at": "2026-02-08T11:00:00+00:00",
        "verified": True,
        "helpful": 14,
        "tags": ["Travel"],
        "featured": False,
    },
    {
        "author": "Riley Park",
        "initials": "RP",
        "rating": 5,
        "title": "Soft surfaces, serious relief",
        "body": (
            "The contact points don't dig in. After a week of consistent use my "
            "afternoon headaches eased. Small thing, huge difference in how the "
            "day ends."
        ),
        "date_label": "Jan 2026",
        "created_at": "2026-01-30T08:00:00+00:00",
        "verified": True,
        "helpful": 36,
        "tags": ["Relief", "Consistent use"],
        "featured": False,
    },
    {
        "author": "Casey Brooks",
        "initials": "CB",
        "rating": 3,
        "title": "Good, not magic",
        "body": (
            "Helps with mild tension. If you need deep tissue work, pair it with "
            "stretching. Still nicer design than anything else on my shelf."
        ),
        "date_label": "Jan 2026",
        "created_at": "2026-01-14T19:00:00+00:00",
        "verified": False,
        "helpful": 9,
        "tags": ["Honest take"],
        "featured": False,
    },
    {
        "author": "Noah Kim",
        "initials": "NK",
        "rating": 5,
        "title": "Design matches the calm it creates",
        "body": (
            "Usually recovery gear looks industrial. This feels intentional — like "
            "it belongs next to good speakers and a clean desk. Performance backs "
            "the look up."
        ),
        "date_label": "Dec 2025",
        "created_at": "2025-12-20T13:00:00+00:00",
        "verified": True,
        "helpful": 22,
        "tags": ["Design", "Calm"],
        "featured": False,
    },
    {
        "author": "Elena Vargas",
        "initials": "EV",
        "rating": 5,
        "title": "Part of my wind-down now",
        "body": (
            "I pair it with dim lights and a short stretch. Ten minutes and I'm "
            "actually ready to sleep instead of scrolling another hour."
        ),
        "date_label": "Dec 2025",
        "created_at": "2025-12-05T21:00:00+00:00",
        "verified": True,
        "helpful": 19,
        "tags": ["Evening wind-down", "Daily ritual"],
        "featured": False,
    },
    {
        "author": "Chris Holt",
        "initials": "CH",
        "rating": 4,
        "title": "Quiet enough for shared space",
        "body": (
            "Apartment walls are thin. This doesn't announce itself. Effectiveness "
            "surprised me for how soft it feels on first use."
        ),
        "date_label": "Nov 2025",
        "created_at": "2025-11-18T10:00:00+00:00",
        "verified": True,
        "helpful": 11,
        "tags": ["Quiet"],
        "featured": False,
    },
    {
        "author": "Ava Brooks",
        "initials": "AB",
        "rating": 5,
        "title": "Better than I expected for the price",
        "body": (
            "Skeptical of recovery gadgets. This one earned a permanent spot. "
            "Heat + compression is the combo that works for my screen eyes and neck."
        ),
        "date_label": "Nov 2025",
        "created_at": "2025-11-02T15:00:00+00:00",
        "verified": True,
        "helpful": 25,
        "tags": ["Relief", "Worth it"],
        "featured": False,
    },
    {
        "author": "Leo Martins",
        "initials": "LM",
        "rating": 4,
        "title": "Solid daily driver",
        "body": (
            "Not flashy. Does what it claims. I use it after long coding blocks "
            "and notice less tightness by evening."
        ),
        "date_label": "Oct 2025",
        "created_at": "2025-10-21T12:00:00+00:00",
        "verified": True,
        "helpful": 13,
        "tags": ["Desk life", "Daily ritual"],
        "featured": False,
    },
]
