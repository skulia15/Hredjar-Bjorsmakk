# Scripts

## Fetch Vínbúðin Beers

Sækir jólabj óra frá Vínbúðinni og bætir þeim við bjóralista.

### Forupplýsingar

1. Playwright browser verður að vera uppsett:
```bash
npx playwright install chromium
```

2. Gagnagrunnur verður að vera keyrandi og aðgengilegur

### Notkun

```bash
# Með local database
npx tsx scripts/fetch-vinbudin-beers.ts

# Með production database
DATABASE_URL="postgresql://..." npx tsx scripts/fetch-vinbudin-beers.ts
```

### Hvað gerist?

1. Opnar Vínbúðin síðuna með Playwright browser
2. Bíður eftir að vörur hlaðist
3. Safnar upplýsingum um alla bjóra
4. Skoðar hverjir bjórar eru þegar í gagnagrunninum
5. Bætir aðeins nýjum bjórum við

### Upplýsingar sem eru sóttar

- Nafn bjórs
- Brugghús
- Vörunúmer Vínbúðinnar
- Verð
- ABV (alkóhólprósenta)
- Stærð og tegund umbúða
- Mynd (ef til)
- Beinn hlekkur á vörusíðu

### Debugging

Ef ekkert finnst mun scriptið:
- Búa til screenshot í `/tmp/vinbudin-debug.png`
- Prenta út hvað var fundið í console

### Að laga gömul gögn

Ef þú hefur bjóra með röngum vörunúmerum (t.d. "BB-GAR-500" í stað "21582"), þá getur þú keyrt:

```bash
# Hreinsað vörunúmer sem eru ekki tölulegar
npx prisma studio
# Í Prisma Studio, opnaðu Beer töfluna og núllstilltu productNumber fyrir bjóra með röngum gildum
```

Eða notaðu SQL beint:
```sql
-- Sjá bjóra með röngum vörunúmerum (ekki tölur)
SELECT name, brewery, productNumber FROM "Beer" WHERE "productNumber" ~ '[^0-9]';

-- Núllstilla þá (þeir verða uppfærðir næst þegar scriptið keyrir)
UPDATE "Beer" SET "productNumber" = NULL WHERE "productNumber" ~ '[^0-9]';
```

### Athugasemdir

- Þetta script virkar **aðeins locally** - það þarf Playwright browser
- Vefendapunkturinn `/api/beers/fetch-vinbudin` virkar **ekki** í production
- Síðan notar JavaScript til að hlaða vörum, þess vegna þarf Playwright
- **Mikilvægt**: Scriptið sækir nú aðeins **tölulegt** productid (t.d. "21582"), ekki SKU kóða

---

## English

### Fetch Vínbúðin Beers

Fetches Christmas beers from Vínbúðin (Icelandic state liquor store) and adds them to the beer catalog.

### Prerequisites

1. Playwright browser must be installed:
```bash
npx playwright install chromium
```

2. Database must be running and accessible

### Usage

```bash
# With local database
npx tsx scripts/fetch-vinbudin-beers.ts

# With production database
DATABASE_URL="postgresql://..." npx tsx scripts/fetch-vinbudin-beers.ts
```

### What happens?

1. Opens Vínbúðin page with Playwright browser
2. Waits for products to load
3. Collects information about all beers
4. Checks which beers already exist in database
5. Only adds new beers

### Information collected

- Beer name
- Brewery
- Vínbúðin product number
- Price
- ABV (alcohol percentage)
- Container size and type
- Image (if available)
- Direct link to product page

### Debugging

If nothing is found, the script will:
- Create a screenshot at `/tmp/vinbudin-debug.png`
- Print what was found to console

### Fixing old data

If you have beers with incorrect product numbers (e.g. "BB-GAR-500" instead of "21582"), you can run:

```bash
# Clean product numbers that are not numeric
npx prisma studio
# In Prisma Studio, open the Beer table and nullify productNumber for beers with wrong values
```

Or use SQL directly:
```sql
-- See beers with wrong product numbers (not numeric)
SELECT name, brewery, productNumber FROM "Beer" WHERE "productNumber" ~ '[^0-9]';

-- Nullify them (they will be updated next time the script runs)
UPDATE "Beer" SET "productNumber" = NULL WHERE "productNumber" ~ '[^0-9]';
```

### Notes

- This script works **locally only** - it requires Playwright browser
- The API endpoint `/api/beers/fetch-vinbudin` does **not** work in production
- The page uses JavaScript to load products, which is why Playwright is needed
- **Important**: The script now only extracts **numeric** productid (e.g. "21582"), not SKU codes
