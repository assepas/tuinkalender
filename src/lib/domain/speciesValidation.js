// Validatie van soorten vóór opslaan in de beheerpagina. Gebruikt precies
// hetzelfde JSON Schema als `npm run validate` (data/schema/), plus de
// kruiscontroles die daar ook gebeuren (bestaande taaktypes, unieke taak-ids).
// De database controleert alleen de minimale vorm; dit is het echte vangnet.

import Ajv from "ajv";
import speciesSchema from "../../../data/schema/species.schema.json";

const ajv = new Ajv({ allErrors: true, strict: false });
const validateSchema = ajv.compile(speciesSchema);

const FIELD_LABELS = {
  "/id": "id",
  "/name": "naam",
  "/category": "categorie",
  "/nativeStatus": "herkomst",
  "/appearance": "uiterlijk",
  "/appearance/shape": "vorm",
  "/appearance/count": "aantal",
  "/appearance/flowerColor": "bloemkleur",
  "/appearance/fruitColor": "vruchtkleur",
  "/bloom/from": "bloei van",
  "/bloom/to": "bloei tot",
  "/tasks": "taken",
  "/growing/sun": "licht",
  "/growing/soil": "grond",
  "/growing/moisture": "vocht",
  "/growing/spacingCm": "plantafstand",
  "/info/intro": "introductie",
  "/info/water": "water geven",
  "/info/tips": "tips",
};

function describePath(path) {
  if (FIELD_LABELS[path]) return FIELD_LABELS[path];
  // Een los item in een lijst, bv. /growing/sun/0 → "licht".
  const parent = path.replace(/\/\d+$/, "");
  if (parent !== path && FIELD_LABELS[parent]) return FIELD_LABELS[parent];
  const task = path.match(/^\/tasks\/(\d+)(\/.*)?$/);
  if (task) return `taak ${Number(task[1]) + 1}${task[2] ? ` (${task[2].slice(1).replaceAll("/", " → ")})` : ""}`;
  return path.slice(1).replaceAll("/", " → ") || "soort";
}

function describeError(err) {
  const where = describePath(err.instancePath);
  switch (err.keyword) {
    case "required":
      return `${where}: "${err.params.missingProperty}" ontbreekt`;
    case "pattern":
      if (err.instancePath.endsWith("Color")) return `${where}: gebruik een kleur als #A1B2C3`;
      if (/\/(from|to)$/.test(err.instancePath)) return `${where}: gebruik MM-DD, bv. 04-15`;
      return `${where}: alleen kleine letters, cijfers en streepjes`;
    case "enum":
      return `${where}: kies een van ${err.params.allowedValues.join(", ")}`;
    case "minLength":
    case "minItems":
      return `${where}: mag niet leeg zijn`;
    case "minimum":
    case "maximum":
      return `${where}: ${err.message.replace("must be", "moet").replace("or equal to", "of gelijk aan")}`;
    case "additionalProperties":
      return `${where}: onbekend veld "${err.params.additionalProperty}"`;
    default:
      return `${where}: ${err.message}`;
  }
}

/**
 * @param {object} species
 * @param {{ taskTypeIds: Set<string>, existingIds?: Set<string>, isNew?: boolean }} ctx
 * @returns {string[]} leesbare foutmeldingen; leeg = geldig
 */
export function validateSpecies(species, { taskTypeIds, existingIds = new Set(), isNew = false }) {
  const errors = [];
  if (!validateSchema(species)) {
    // oneOf (taakvensters) geeft per alternatief fouten; de samenvattende
    // oneOf-melding zelf voegt niets toe.
    const seen = new Set();
    for (const err of validateSchema.errors) {
      if (err.keyword === "oneOf" || err.keyword === "if" || err.keyword === "const") continue;
      const msg = describeError(err);
      if (!seen.has(msg)) {
        seen.add(msg);
        errors.push(msg);
      }
    }
  }

  if (isNew && existingIds.has(species.id)) {
    errors.push(`id: "${species.id}" bestaat al`);
  }

  const taskIds = new Set();
  (species.tasks ?? []).forEach((task, i) => {
    if (task.type && !taskTypeIds.has(task.type)) {
      errors.push(`taak ${i + 1}: onbekend taaktype "${task.type}"`);
    }
    if (taskIds.has(task.id)) errors.push(`taak ${i + 1}: id "${task.id}" komt twee keer voor`);
    taskIds.add(task.id);
  });

  return errors;
}

/** "Gele lis" → "gele-lis" (voor het id van een nieuwe soort). */
export function slugify(text) {
  return (text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
