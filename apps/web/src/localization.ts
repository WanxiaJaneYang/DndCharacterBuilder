import type { PackLocale } from "@dcb/datapack";
import type { Language } from "./uiText";

function humanizeToken(token: string): string {
  const normalized = token
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
  if (!normalized) return token;
  return normalized
    .split(" ")
    .map((word) => {
      if (!word) return word;
      return word[0]!.toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function localizedSkillName(
  locale: PackLocale | undefined,
  skillId: string,
): string | undefined {
  const textName = locale?.entityText?.skills?.[skillId]?.name;
  if (typeof textName === "string" && textName.length > 0) return textName;
  const entityName = locale?.entityNames?.skills?.[skillId];
  if (typeof entityName === "string" && entityName.length > 0) return entityName;
  return undefined;
}

export function resolveSpecializedSkillLabel(args: {
  locale: PackLocale | undefined;
  language: Language;
  skillId: string;
}): string | null {
  const { locale, language, skillId } = args;

  const direct = localizedSkillName(locale, skillId);
  if (direct) return direct;

  const separatorIndex = skillId.indexOf(":");
  if (separatorIndex <= 0 || separatorIndex === skillId.length - 1) return null;

  const parentSkillId = skillId.slice(0, separatorIndex);
  const specializationId = skillId.slice(separatorIndex + 1);
  const parentLabel =
    localizedSkillName(locale, parentSkillId) ?? humanizeToken(parentSkillId);
  const specializationLabel = humanizeToken(specializationId);
  const openParen = language === "zh" ? "\uFF08" : " (";
  const closeParen = language === "zh" ? "\uFF09" : ")";

  return `${parentLabel}${openParen}${specializationLabel}${closeParen}`;
}

