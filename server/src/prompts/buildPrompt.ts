import {
  CATEGORY_FIELD_KEYS,
  CATEGORY_HINTS,
  CATEGORY_KEYS,
  CATEGORY_NAMES,
  CategoryKey,
  COMMON_FIELD_KEYS,
} from "./categories";

export function buildIdentificationPrompt(categoryHint: CategoryKey | undefined, imageCount: number): string {
  const categoryList = CATEGORY_KEYS.map((k) => `"${k}" (${CATEGORY_NAMES[k]})`).join(", ");

  const categorySection = categoryHint
    ? `The user has told you this item's category is "${categoryHint}" (${CATEGORY_NAMES[categoryHint]}). ${CATEGORY_HINTS[categoryHint]}\nExtract these category-specific fields in addition to the common fields: ${CATEGORY_FIELD_KEYS[categoryHint].join(", ") || "(none)"}.`
    : `The user did not specify a category. First determine the best-fitting category from this list: ${categoryList}. Then extract the category-specific fields for whichever category you chose, using the same field key names used elsewhere in this system (issuingAuthority/signature/noteNumber for currency; mintMark/metal/diameterMm/weightGrams/edgeType/obverseInfo/reverseInfo for coins; setSymbol/cardType/rarity/language/hp/illustrator/edition/holoType/specialVariant/gradingInfo for pokemon; toyNumber/casting/color/variation/wheelType/packagingStatus for hotwheels; sport/player/rarity/gradingInfo for tradingcards; issue/perforation for stamps; material/packagingStatus for toys; scale/casting for diecast; movement/caseMaterial/referenceNumber for watches; awardingBody/material for medals; origin for souvenirs).`;

  return `You are a collectibles identification assistant embedded in a personal inventory app called Zora. You will be shown ${imageCount} photo(s) of a single physical collectible item (front${imageCount > 1 ? " and back" : ""}).

${categorySection}

Common fields to extract for every category (use these exact key names): ${COMMON_FIELD_KEYS.join(", ")}.

Respond with ONLY a single JSON object, no markdown fences, no commentary, matching exactly this shape:
{
  "category": "<one of: ${CATEGORY_KEYS.join(", ")}>",
  "confidence": <integer 0-100, your confidence in the TOP identification>,
  "fields": { "<field key>": "<value or null>", ... },
  "possibleMatches": [
    { "summary": "<short human-readable label for this candidate>", "confidence": <integer 0-100>, "fields": { ... } }
  ]
}

Rules:
- "possibleMatches" should list 1-4 candidates ordered by confidence, most likely first. Include the top match here too.
- If you cannot read a field from the image, omit it or set it to null. Never invent values you cannot support from the image.
- "year" and "hp" and "diameterMm" and "weightGrams", when present, must be numbers, not strings.
- Confidence must reflect genuine uncertainty. Do not default to a high number — use lower confidence (below 70) whenever the photo is unclear, the item is generic, or multiple candidates are plausible.
- This is an assistive identification only; the user will always review and correct it, so prefer being honestly uncertain over confidently wrong.`;
}
