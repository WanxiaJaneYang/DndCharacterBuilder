import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);

function getCliOption(name) {
  const prefix = `--${name}=`;
  for (const arg of argv) {
    if (arg.startsWith(prefix)) {
      return arg.slice(prefix.length);
    }
  }
  return undefined;
}

const SOURCE_ROOT = getCliOption("sourceRoot") ?? process.env.DND_DATA_ROOT;
if (!SOURCE_ROOT) {
  throw new Error("Missing source root; set DND_DATA_ROOT or pass --sourceRoot=/path/to/dndData");
}

const CHAPTER_PATH = getCliOption("chapterPath") ?? path.join(SOURCE_ROOT, "chunks", "level4plus", "n-07-chapter-five-feats.json");
const FEAT_SOURCE_DIR = path.join(SOURCE_ROOT, "feats");
const OUTPUT_PATH = getCliOption("out")
  ? path.resolve(process.cwd(), getCliOption("out"))
  : fileURLToPath(new URL("../../packs/srd-35e-minimal/entities/feats.json", import.meta.url));

const FOOTER_LINES = new Set(["CHAPTER 5:", "FEATS"]);
const TABLE_MARKERS = [
  /^Table 5/,
  /^General Feats Prerequisites Benefit$/,
  /^Item Creation Feats Prerequisites Benefit$/,
  /^Metamagic Feats Prerequisites Benefit$/
];

const SOURCE_KEY_OVERRIDES = new Map([
  ["armor-proficiency-heavy", "armor-proficiency"],
  ["armor-proficiency-light", "armor-proficiency"],
  ["armor-proficiency-medium", "armor-proficiency"],
  ["weapon-focus-longsword", "weapon-focus"]
]);

const MODELED_FEAT_OVERRIDES = {
  "power-attack": {
    constraints: [{ kind: "abilityMin", ability: "str", score: 13 }]
  },
  "weapon-focus-longsword": {
    effects: [
      {
        kind: "add",
        targetPath: "stats.attackBonus",
        value: { const: 1 }
      }
    ],
    summary: "Gain a +1 bonus on attack rolls made with longsword."
  }
};

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCaseWord(word) {
  return word
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part))
    .join("-");
}

function toDisplayName(rawTitle) {
  return rawTitle
    .split(/(\s+|\(|\))/)
    .map((token) => {
      if (!token || /^\s+$/.test(token) || token === "(" || token === ")") {
        return token;
      }
      return titleCaseWord(token);
    })
    .join("");
}

function firstSentence(text) {
  const trimmed = text.trim();
  const match = trimmed.match(/^.*?[.!?](?:\s|$)/);
  return (match ? match[0] : trimmed).trim();
}

function loadSourcePagesByKey() {
  const pagesByKey = new Map();
  for (const entry of fs.readdirSync(FEAT_SOURCE_DIR, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }

    const key = entry.name.replace(/\.json$/i, "");
    const record = JSON.parse(fs.readFileSync(path.join(FEAT_SOURCE_DIR, entry.name), "utf8"));
    if (Array.isArray(record.sourcePages) && record.sourcePages.length > 0) {
      pagesByKey.set(key, record.sourcePages);
    }
  }
  return pagesByKey;
}

function extractHeadingRecords(chapterText) {
  const start = chapterText.indexOf("FEAT DESCRIPTIONS");
  if (start === -1) {
    throw new Error("Could not find FEAT DESCRIPTIONS section in finalized feat chapter.");
  }

  const lines = chapterText.slice(start).replace(/\r/g, "").split("\n");
  const records = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    const nextLine = (lines[index + 1] ?? "").trim();

    let heading = null;
    let headingLineCount = 0;

    if (/^[A-Z0-9()'., -]+ \[[A-Z ]+\]$/.test(line)) {
      heading = line;
      headingLineCount = 1;
    } else if (/^[A-Z0-9()'., -]+$/.test(line) && /^\[[A-Z ]+\]$/.test(nextLine)) {
      heading = `${line} ${nextLine}`;
      headingLineCount = 2;
    }

    if (!heading || heading === "FEAT NAME [TYPE OF FEAT]") {
      continue;
    }

    const headingMatch = heading.match(/^(?<title>[A-Z0-9()'., -]+) \[(?<type>[A-Z ]+)\]$/);
    if (!headingMatch?.groups) {
      continue;
    }

    records.push({
      title: headingMatch.groups.title.trim(),
      featType: headingMatch.groups.type.trim(),
      startLine: index,
      bodyStartLine: index + headingLineCount
    });
  }

  for (let index = 0; index < records.length; index += 1) {
    records[index].bodyEndLine = (records[index + 1]?.startLine ?? lines.length) - 1;
  }

  return { lines, records };
}

function extractBody(lines, bodyStartLine, bodyEndLine) {
  const keptLines = [];
  for (let index = bodyStartLine; index <= bodyEndLine; index += 1) {
    const rawLine = lines[index] ?? "";
    const line = rawLine.trim();

    if (TABLE_MARKERS.some((pattern) => pattern.test(line))) {
      break;
    }

    if (line === "" || FOOTER_LINES.has(line)) {
      keptLines.push("");
      continue;
    }

    if (/^\d+$/.test(line)) {
      continue;
    }

    if (/^Illus\. by /.test(line)) {
      continue;
    }

    keptLines.push(rawLine);
  }

  return keptLines.join("\n").trim();
}

function parseSections(bodyText) {
  const sections = {
    intro: [],
    prerequisite: [],
    benefit: [],
    normal: [],
    special: []
  };

  const normalized = bodyText
    .replace(/-\s*\n\s*/g, "")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  const labelPattern = /(Prerequisite|Prerequisites|Benefit|Normal|Special):/g;
  const matches = Array.from(normalized.matchAll(labelPattern));
  const firstLabelIndex = matches[0]?.index ?? normalized.length;
  const intro = normalized.slice(0, firstLabelIndex).trim();
  if (intro) {
    sections.intro.push(intro);
  }

  for (let index = 0; index < matches.length; index += 1) {
    const label = matches[index][1];
    const contentStart = (matches[index].index ?? 0) + matches[index][0].length;
    const contentEnd = matches[index + 1]?.index ?? normalized.length;
    const content = normalized.slice(contentStart, contentEnd).trim();
    if (!content) {
      continue;
    }

    const key = label.startsWith("Prerequisite") ? "prerequisite" : label.toLowerCase();
    sections[key].push(content);
  }

  return sections;
}

function buildDescription(heading, sections) {
  const parts = [heading];

  if (sections.intro.length > 0) {
    parts.push(...sections.intro);
  }
  if (sections.prerequisite.length > 0) {
    parts.push(`Prerequisite${sections.prerequisite.length > 1 ? "s" : ""}: ${sections.prerequisite.join(" ")}`);
  }
  if (sections.benefit.length > 0) {
    parts.push(`Benefit: ${sections.benefit.join(" ")}`);
  }
  if (sections.normal.length > 0) {
    parts.push(`Normal: ${sections.normal.join(" ")}`);
  }
  if (sections.special.length > 0) {
    parts.push(`Special: ${sections.special.join(" ")}`);
  }

  return parts.join("\n");
}

function buildDeferredMechanics(id, benefitText, featType) {
  return [
    {
      id: `${id}-benefit`,
      category: "feat-benefit",
      description: `${featType} feat benefit is preserved from source text but not yet enforced by the current engine. ${benefitText}`.trim(),
      dependsOn: ["feat-effect-engine", "character-sheet-derived-feat-benefits"],
      impactPaths: ["selections.feat", "derived.featBenefits"]
    }
  ];
}

function buildFeatEntity(record, pagesByKey) {
  const id = slugify(record.title);
  const heading = `${record.title} [${record.featType}]`;
  const bodyText = extractBody(record.lines, record.bodyStartLine, record.bodyEndLine);
  const sections = parseSections(bodyText);
  const description = buildDescription(heading, sections);
  const sourceKey = SOURCE_KEY_OVERRIDES.get(id) ?? id;
  const sourcePages = pagesByKey.get(sourceKey);
  if (!sourcePages) {
    throw new Error(`Missing sourcePages for feat "${id}" (sourceKey "${sourceKey}")`);
  }

  const feat = {
    id,
    name: toDisplayName(record.title),
    entityType: "feats",
    summary: firstSentence(sections.intro[0] ?? sections.benefit[0] ?? record.title),
    description,
    portraitUrl: null,
    iconUrl: null,
    data: {
      sourcePages,
      text: description,
      sourceKey,
      featType: record.featType
    }
  };

  if (sections.prerequisite.length > 0) {
    feat.data.prerequisite = sections.prerequisite.join(" ");
  }
  if (sections.benefit.length > 0) {
    feat.data.benefit = sections.benefit.join(" ");
  }
  if (sections.normal.length > 0) {
    feat.data.normal = sections.normal.join(" ");
  }
  if (sections.special.length > 0) {
    feat.data.special = sections.special.join(" ");
  }

  const modeled = MODELED_FEAT_OVERRIDES[id];
  if (modeled?.constraints) {
    feat.constraints = modeled.constraints;
  }
  if (modeled?.effects) {
    feat.effects = modeled.effects;
  }
  if (modeled?.summary) {
    feat.summary = modeled.summary;
  }

  if (!modeled?.effects && feat.data.benefit) {
    feat.data.deferredMechanics = buildDeferredMechanics(id, feat.data.benefit, record.featType);
  }

  return feat;
}

function buildWeaponFocusLongsword(pagesByKey) {
  const sourceKey = "weapon-focus";
  const sourcePages = pagesByKey.get(sourceKey);
  if (!sourcePages) {
    throw new Error(`Missing sourcePages for feat "weapon-focus-longsword" (sourceKey "${sourceKey}")`);
  }
  const description = [
    "WEAPON FOCUS [GENERAL]",
    "Choose one type of weapon, such as greataxe. You can also choose unarmed strike or grapple (or ray, if you are a spellcaster) as your weapon for purposes of this feat. You are especially good at using this weapon. (If you have chosen ray, you are especially good with rays, such as the one produced by the ray of frost spell.)",
    "Prerequisites: Proficiency with selected weapon, base attack bonus +1.",
    "Benefit: You gain a +1 bonus on all attack rolls you make using the selected weapon.",
    "Special: You can gain this feat multiple times. Its effects do not stack. Each time you take the feat, it applies to a new type of weapon. A fighter may select Weapon Focus as one of his fighter bonus feats (see page 38). He must have Weapon Focus with a weapon to gain the Weapon Specialization feat for that weapon."
  ].join("\n");

  return {
    id: "weapon-focus-longsword",
    name: "Weapon Focus (Longsword)",
    entityType: "feats",
    effects: MODELED_FEAT_OVERRIDES["weapon-focus-longsword"].effects,
    summary: MODELED_FEAT_OVERRIDES["weapon-focus-longsword"].summary,
    description,
    portraitUrl: null,
    iconUrl: null,
    data: {
      sourcePages,
      text: description,
      sourceKey,
      featType: "GENERAL",
      prerequisite: "Proficiency with selected weapon, base attack bonus +1.",
      benefit: "You gain a +1 bonus on all attack rolls you make using the selected weapon.",
      special:
        "You can gain this feat multiple times. Its effects do not stack. Each time you take the feat, it applies to a new type of weapon. A fighter may select Weapon Focus as one of his fighter bonus feats (see page 38). He must have Weapon Focus with a weapon to gain the Weapon Specialization feat for that weapon."
    }
  };
}

function main() {
  const chapter = JSON.parse(fs.readFileSync(CHAPTER_PATH, "utf8"));
  const pagesByKey = loadSourcePagesByKey();
  const extracted = extractHeadingRecords(chapter.text);

  for (const record of extracted.records) {
    record.lines = extracted.lines;
  }

  const feats = extracted.records.map((record) => buildFeatEntity(record, pagesByKey));
  const genericWeaponFocusIndex = feats.findIndex((feat) => feat.id === "weapon-focus");
  const weaponFocusLongsword = buildWeaponFocusLongsword(pagesByKey);

  if (genericWeaponFocusIndex === -1) {
    feats.push(weaponFocusLongsword);
  } else {
    feats.splice(genericWeaponFocusIndex + 1, 0, weaponFocusLongsword);
  }

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(feats, null, 2)}\n`, "utf8");
  console.log(`Wrote ${feats.length} feat entities to ${OUTPUT_PATH}`);
}

main();
