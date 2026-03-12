import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveLoadedPacks } from "@dcb/datapack";
import type { Page } from "@dcb/schema";
import { loadMinimalPack } from "./loadMinimalPack";
import {
  DEFAULT_STATS,
  compute,
} from "@dcb/engine";
import {
  applyChoice,
  initialState,
  listChoices,
  type CharacterState,
} from "@dcb/engine/legacy";
import {
  EDITIONS,
  FALLBACK_EDITION,
  type EditionOption,
  defaultEditionId,
} from "./editions";
import {
  detectDefaultLanguage,
  uiText,
  type AbilityCode,
  type Language,
  type UIText,
} from "./uiText";
import { resolveSpecializedSkillLabel } from "./localization";
import { characterSpecFromState } from "./characterSpecFromState";
import { createAbilityModeSelectorHandlers } from "./createAbilityModeSelectorHandlers";
import { buildAbilitiesAllocatorPageData } from "./pageComposer/buildAbilitiesAllocatorPageData";
import { buildReviewSheetPageData } from "./pageComposer/buildReviewSheetPageData";
import { buildSkillsAllocatorPageData } from "./pageComposer/buildSkillsAllocatorPageData";
import type {
  AbilityMode,
} from "./pageComposer/pageDataBuilders";
import {
  buildEntityTypeSingleSelectData,
  buildMetadataNameFieldData,
  getUITextValue,
} from "./pageComposer/pageDataBuilders";
import {
  PageComposer,
} from "./pageComposer/PageComposer";

const embeddedPacks = [loadMinimalPack()];
type Role = "dm" | "player" | null;

const STEP_ID_FEAT = "feat";
const STEP_ID_SKILLS = "skills";
const STEP_ID_ABILITIES = "abilities";
const DEFAULT_EXPORT_NAME = "character";
const ABILITY_ORDER = ["str", "dex", "con", "int", "wis", "cha"] as const;
type FlowStep = ReturnType<typeof resolveLoadedPacks>["flow"]["steps"][number];

type AbilityStepConfig = {
  modes?: AbilityMode[];
  defaultMode?: AbilityMode;
  pointBuy?: {
    costTable?: Record<string, number>;
    defaultPointCap?: number;
    minPointCap?: number;
    maxPointCap?: number;
    pointCapStep?: number;
    minScore?: number;
    maxScore?: number;
  };
  phb?: {
    methodType?: "standardArray" | "manualRange";
    standardArray?: number[];
    manualRange?: { minScore?: number; maxScore?: number };
  };
  rollSets?: {
    setsCount?: number;
    rollFormula?: string;
    scoresPerSet?: number;
    assignmentPolicy?: "assign_after_pick";
  };
};

type AbilityPresentationConfig = {
  showExistingModifiers?: boolean;
  groupBy?: "sourceType";
  hideZeroEffectGroups?: boolean;
  sourceTypeLabels?: Record<string, string>;
  modeUi?: Partial<
    Record<AbilityMode, { labelKey?: string; hintKey?: string }>
  >;
};

const DEFAULT_ABILITY_MIN = 3;
const DEFAULT_ABILITY_MAX = 18;

const FALLBACK_ABILITIES_PAGE_SCHEMA: Page = {
  id: "builtin.character.abilities",
  root: {
    id: "builtin-abilities-root",
    componentId: "layout.singleColumn",
    children: [
      {
        id: "builtin-abilities-allocator",
        componentId: "abilities.allocator",
        slot: "main",
        dataSource: "page.abilitiesAllocator",
      },
    ],
  },
};

const FALLBACK_SKILLS_PAGE_SCHEMA: Page = {
  id: "builtin.character.skills",
  root: {
    id: "builtin-skills-root",
    componentId: "layout.singleColumn",
    children: [
      {
        id: "builtin-skills-allocator",
        componentId: "skills.allocator",
        slot: "main",
        dataSource: "page.skillsAllocator",
      },
    ],
  },
};

export function resolvePageSchemaForStep(
  step: FlowStep,
  pageSchemas: Record<string, Page>,
): Page | undefined {
  if (step.pageSchemaId) return pageSchemas[step.pageSchemaId];
  if (step.kind === "abilities") return FALLBACK_ABILITIES_PAGE_SCHEMA;
  if (step.kind === "skills") return FALLBACK_SKILLS_PAGE_SCHEMA;
  return undefined;
}

function getEntityDataRecord(entity: { data?: unknown } | undefined): Record<string, unknown> {
  if (!entity?.data || typeof entity.data !== "object" || Array.isArray(entity.data)) {
    return {};
  }
  return entity.data as Record<string, unknown>;
}

function rollScoreByFormula(formula: string): number {
  if (formula !== "4d6_drop_lowest") return 10;
  const rolls = Array.from(
    { length: 4 },
    () => Math.floor(Math.random() * 6) + 1,
  ).sort((a, b) => a - b);
  return rolls.slice(1).reduce((sum, value) => sum + value, 0);
}

function generateRollSets(config: AbilityStepConfig["rollSets"]): number[][] {
  const setsCount = Math.max(1, Number(config?.setsCount ?? 1));
  const scoresPerSet = Math.max(
    1,
    Number(config?.scoresPerSet ?? ABILITY_ORDER.length),
  );
  const formula = String(config?.rollFormula ?? "4d6_drop_lowest");
  return Array.from({ length: setsCount }, () =>
    Array.from({ length: scoresPerSet }, () => rollScoreByFormula(formula)),
  );
}

function clampAbilityScore(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  const clamped = Math.min(max, Math.max(min, value));
  return Math.round(clamped);
}

function derivePointBuyBaseScore(
  costTable: Record<string, number>,
  fallback: number,
): number {
  const zeroCostScores = Object.entries(costTable)
    .filter(([, cost]) => Number(cost) === 0)
    .map(([score]) => Number(score))
    .filter((score) => Number.isFinite(score));
  return zeroCostScores.length > 0 ? Math.min(...zeroCostScores) : fallback;
}

export function App() {
  const [state, setState] = useState<CharacterState>(initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [showProv, setShowProv] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [language, setLanguage] = useState<Language>(detectDefaultLanguage);
  const [selectedEditionId, setSelectedEditionId] = useState<string>(() =>
    defaultEditionId(EDITIONS),
  );
  const [selectedOptionalPackIds, setSelectedOptionalPackIds] = useState<
    string[]
  >([]);
  const [rulesReady, setRulesReady] = useState(false);
  const [abilityMethodHintOpen, setAbilityMethodHintOpen] = useState(false);
  const [abilityMethodHintPinned, setAbilityMethodHintPinned] = useState(false);
  const [isPointBuyTableOpen, setIsPointBuyTableOpen] = useState(false);
  const abilityMethodHintRef = useRef<HTMLDivElement | null>(null);

  const selectedEdition = useMemo(
    () =>
      EDITIONS.find((edition) => edition.id === selectedEditionId) ??
      EDITIONS[0] ??
      FALLBACK_EDITION,
    [selectedEditionId],
  );
  const enabledPackIds = useMemo(
    () =>
      [
        selectedEdition.basePackId,
        ...selectedOptionalPackIds.filter((packId) =>
          selectedEdition.optionalPackIds.includes(packId),
        ),
      ].filter((packId) => packId.trim().length > 0),
    [selectedEdition, selectedOptionalPackIds],
  );
  const resolvedData = useMemo(
    () => resolveLoadedPacks(embeddedPacks, enabledPackIds),
    [enabledPackIds],
  );
  const context = useMemo(
    () => ({ enabledPackIds, resolvedData }),
    [enabledPackIds, resolvedData],
  );
  const activeLocale = useMemo(
    () => context.resolvedData.locales[language],
    [context.resolvedData.locales, language],
  );

  const wizardSteps = useMemo(
    () =>
      context.resolvedData.flow.steps.map((step) => ({
        ...step,
        label: activeLocale?.flowStepLabels?.[step.id] ?? step.label,
      })),
    [activeLocale?.flowStepLabels, context.resolvedData.flow.steps],
  );
  const currentStep = wizardSteps[stepIndex];

  useEffect(() => {
    if (stepIndex >= wizardSteps.length) {
      setStepIndex(0);
    }
  }, [stepIndex, wizardSteps.length]);

  useEffect(() => {
    if (currentStep?.kind !== "abilities") {
      setAbilityMethodHintOpen(false);
      setAbilityMethodHintPinned(false);
    }
  }, [currentStep?.kind]);

  useEffect(() => {
    if (!abilityMethodHintPinned) return;
    const closeHint = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target || abilityMethodHintRef.current?.contains(target)) return;
      setAbilityMethodHintPinned(false);
      setAbilityMethodHintOpen(false);
    };
    window.addEventListener("mousedown", closeHint);
    window.addEventListener("touchstart", closeHint);
    return () => {
      window.removeEventListener("mousedown", closeHint);
      window.removeEventListener("touchstart", closeHint);
    };
  }, [abilityMethodHintPinned]);

  const t = uiText[language];
  const localizeLoadCategory = (category: "light" | "medium" | "heavy") => {
    if (category === "medium") return t.REVIEW_LOAD_CATEGORY_MEDIUM;
    if (category === "heavy") return t.REVIEW_LOAD_CATEGORY_HEAVY;
    return t.REVIEW_LOAD_CATEGORY_LIGHT;
  };
  const formatSpeedImpact = (adjustedSpeed: number, reducesSpeed: boolean) =>
    reducesSpeed
      ? t.REVIEW_SPEED_IMPACT_REDUCED.replace("{speed}", String(adjustedSpeed))
      : t.REVIEW_SPEED_IMPACT_NONE;
  const formatMovementNotes = (reducedByArmorOrLoad: boolean) =>
    reducedByArmorOrLoad
      ? [t.REVIEW_MOVEMENT_NOTE_ARMOR_OR_LOAD]
      : [t.REVIEW_MOVEMENT_NOTE_NONE];
  const localizeAbilityLabel = useCallback(
    (ability: string): string => {
      return t.ABILITY_LABELS[ability.toUpperCase() as Uppercase<AbilityCode>] ?? ability.toUpperCase();
    },
    [t.ABILITY_LABELS],
  );
  const localizeEntityText = useCallback(
    (
      entityType: string,
      entityId: string,
      path: string,
      fallback: string,
    ): string => {
      const text = activeLocale?.entityText?.[entityType]?.[entityId]?.[path];
      if (typeof text === "string" && text.length > 0) return text;
      if (path === "name") {
        const name = activeLocale?.entityNames?.[entityType]?.[entityId];
        if (typeof name === "string" && name.length > 0) return name;
        if (entityType === "skills") {
          const specialized = resolveSpecializedSkillLabel({
            locale: activeLocale,
            language,
            skillId: entityId,
          });
          if (specialized) return specialized;
        }
      }
      return fallback;
    },
    [activeLocale, language],
  );
  const choices = useMemo(() => listChoices(state, context), [context, state]);
  const localizedChoices = useMemo(
    () =>
      choices.map((choice) => {
        const flowStep = wizardSteps.find((step) => step.id === choice.stepId);
        if (!flowStep || !("entityType" in flowStep.source)) {
          return {
            ...choice,
            label:
              activeLocale?.flowStepLabels?.[choice.stepId] ?? choice.label,
          };
        }
        const entityType = flowStep.source.entityType;
        return {
          ...choice,
          label: activeLocale?.flowStepLabels?.[choice.stepId] ?? choice.label,
          options: choice.options.map((option) => ({
            ...option,
            label: localizeEntityText(
              entityType,
              option.id,
              "name",
              option.label,
            ),
          })),
        };
      }),
    [activeLocale?.flowStepLabels, choices, localizeEntityText, wizardSteps],
  );
  const choiceMap = new Map(localizedChoices.map((c) => [c.stepId, c]));
  const spec = useMemo(
    () =>
      characterSpecFromState({
        state,
        rulesetId: selectedEdition.id,
        sourceIds: enabledPackIds,
      }),
    [enabledPackIds, selectedEdition.id, state],
  );
  const computeResult = useMemo(
    () => compute(spec, { resolvedData, enabledPackIds }),
    [enabledPackIds, resolvedData, spec],
  );
  const skillEntities = useMemo(() => {
    return Object.values(context.resolvedData.entities.skills ?? {})
      .map((skill) => ({
        ...skill,
        displayName: localizeEntityText("skills", skill.id, "name", skill.name),
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [context.resolvedData.entities.skills, localizeEntityText]);
  const selectedFeats = (state.selections.feats as string[] | undefined) ?? [];
  const sourceNameByEntityId = useMemo(() => {
    const map = new Map<string, string>();
    for (const [entityType, bucket] of Object.entries(
      context.resolvedData.entities,
    )) {
      for (const entity of Object.values(bucket)) {
        const localized =
          activeLocale?.entityText?.[entityType]?.[entity.id]?.name ??
          activeLocale?.entityNames?.[entityType]?.[entity.id] ??
          entity.name;
        map.set(`${entity._source.packId}:${entity.id}`, localized);
      }
    }
    return map;
  }, [
    activeLocale?.entityNames,
    activeLocale?.entityText,
    context.resolvedData.entities,
  ]);
  const packVersionById = useMemo(() => {
    const map = new Map<string, string>();
    for (const manifest of context.resolvedData.manifests) {
      map.set(manifest.id, manifest.version || t.REVIEW_UNKNOWN_VERSION);
    }
    return map;
  }, [context.resolvedData.manifests, t.REVIEW_UNKNOWN_VERSION]);
  const provenanceByTargetPath = useMemo(() => {
    const provenance = computeResult.provenance ?? [];
    const map = new Map<string, typeof provenance>();
    for (const record of provenance) {
      const existing = map.get(record.targetPath);
      if (existing) {
        existing.push(record);
      } else {
        map.set(record.targetPath, [record]);
      }
    }
    return map;
  }, [computeResult.provenance]);
  const sourceMetaByEntityKey = useMemo(() => {
    const map = new Map<string, { sourceType: string; sourceLabel: string }>();
    for (const [entityType, bucket] of Object.entries(
      context.resolvedData.entities,
    )) {
      for (const entity of Object.values(bucket)) {
        const sourceLabel =
          activeLocale?.entityText?.[entityType]?.[entity.id]?.name ??
          activeLocale?.entityNames?.[entityType]?.[entity.id] ??
          entity.name;
        map.set(`${entity._source.packId}:${entity.id}`, {
          sourceType: entityType,
          sourceLabel,
        });
      }
    }
    return map;
  }, [
    activeLocale?.entityNames,
    activeLocale?.entityText,
    context.resolvedData.entities,
  ]);
  const reviewData = computeResult.sheetViewModel.data.review;
  const combatData = computeResult.sheetViewModel.data.combat;
  const skillViewModelById = useMemo(
    () =>
      new Map(
        computeResult.sheetViewModel.data.skills.map((skill) => [skill.id, skill]),
      ),
    [computeResult.sheetViewModel.data.skills],
  );
  const selectedRaceEntity = useMemo(() => {
    return spec.raceId
      ? context.resolvedData.entities.races?.[spec.raceId]
      : undefined;
  }, [context.resolvedData.entities.races, spec.raceId]);
  const selectedClassEntity = useMemo(() => {
    return spec.class?.classId
      ? context.resolvedData.entities.classes?.[spec.class.classId]
      : undefined;
  }, [context.resolvedData.entities.classes, spec.class?.classId]);
  const selectedSkillRanks = useMemo(() => {
    const raw = state.selections[STEP_ID_SKILLS];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    return Object.entries(raw as Record<string, unknown>).reduce<Record<string, number>>(
      (acc, [skillId, value]) => {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue) || numericValue < 0) return acc;
        acc[skillId] = numericValue;
        return acc;
      },
      {},
    );
  }, [state.selections]);

  const selectedStepValues = (stepId: string): string[] => {
    if (stepId === STEP_ID_FEAT) return selectedFeats;
    const value = state.selections[stepId];
    if (Array.isArray(value)) return value.map(String);
    if (value === undefined || value === null || value === "") return [];
    return [String(value)];
  };

  const abilityStepConfig = useMemo(() => {
    const abilityStep = wizardSteps.find(
      (step) => step.id === STEP_ID_ABILITIES,
    ) as { abilitiesConfig?: AbilityStepConfig } | undefined;
    return abilityStep?.abilitiesConfig;
  }, [wizardSteps]);
  const abilityPresentation = useMemo(() => {
    const abilityStep = wizardSteps.find(
      (step) => step.id === STEP_ID_ABILITIES,
    ) as { abilityPresentation?: AbilityPresentationConfig } | undefined;
    return abilityStep?.abilityPresentation;
  }, [wizardSteps]);
  const abilityModes: AbilityMode[] = abilityStepConfig?.modes?.length
    ? abilityStepConfig.modes
    : [];
  const abilityMeta =
    (state.selections.abilitiesMeta as
      | {
          mode?: AbilityMode;
          pointCap?: number;
          rollSets?: { generatedSets?: number[][]; selectedSetIndex?: number };
        }
      | undefined) ?? {};
  const selectedAbilityMode: AbilityMode | undefined =
    abilityMeta.mode ?? abilityStepConfig?.defaultMode ?? abilityModes[0];
  const isAbilityMode = (value: string): value is AbilityMode =>
    abilityModes.some((mode) => mode === value);
  const selectedAbilityModeValue =
    selectedAbilityMode && isAbilityMode(selectedAbilityMode)
      ? selectedAbilityMode
      : (abilityModes[0] ?? "");
  const activeAbilityModeHint = selectedAbilityMode
    ? getUITextValue(
        t,
        abilityPresentation?.modeUi?.[selectedAbilityMode]?.hintKey,
      ) ?? ""
    : "";
  const rollSetsConfig = abilityStepConfig?.rollSets;
  const generatedRollSets = Array.isArray(abilityMeta.rollSets?.generatedSets)
    ? abilityMeta.rollSets.generatedSets
    : [];
  const selectedRollSetIndexRaw = Number(
    abilityMeta.rollSets?.selectedSetIndex,
  );
  const selectedRollSetIndex = Number.isInteger(selectedRollSetIndexRaw)
    ? selectedRollSetIndexRaw
    : -1;
  const selectedRollSet =
    selectedRollSetIndex >= 0 && selectedRollSetIndex < generatedRollSets.length
      ? generatedRollSets[selectedRollSetIndex]
      : undefined;
  const rollSetNeedsSelection =
    selectedAbilityMode === "rollSets" &&
    generatedRollSets.length > 0 &&
    !selectedRollSet;
  const rollScoresPool =
    selectedRollSet && selectedRollSet.length > 0 ? selectedRollSet : [];
  const currentScores = ABILITY_ORDER.map((ability) =>
    Number(state.abilities[ability] ?? DEFAULT_ABILITY_MIN),
  );
  const phbStandardArray =
    abilityStepConfig?.phb?.methodType === "standardArray"
      ? (abilityStepConfig.phb.standardArray ?? [])
      : [];
  const abilityMinScore =
    selectedAbilityMode === "pointBuy"
      ? Number(abilityStepConfig?.pointBuy?.minScore ?? DEFAULT_ABILITY_MIN)
      : selectedAbilityMode === "phb" &&
          abilityStepConfig?.phb?.methodType === "manualRange"
        ? Number(
            abilityStepConfig.phb.manualRange?.minScore ?? DEFAULT_ABILITY_MIN,
          )
        : selectedAbilityMode === "phb" && phbStandardArray.length
          ? Math.min(...phbStandardArray)
          : selectedAbilityMode === "rollSets" && rollScoresPool.length
            ? Math.min(...rollScoresPool)
            : Math.min(...currentScores, DEFAULT_ABILITY_MIN);
  const abilityMaxScore =
    selectedAbilityMode === "pointBuy"
      ? Number(abilityStepConfig?.pointBuy?.maxScore ?? DEFAULT_ABILITY_MAX)
      : selectedAbilityMode === "phb" &&
          abilityStepConfig?.phb?.methodType === "manualRange"
        ? Number(
            abilityStepConfig.phb.manualRange?.maxScore ?? DEFAULT_ABILITY_MAX,
          )
        : selectedAbilityMode === "phb" && phbStandardArray.length
          ? Math.max(...phbStandardArray)
          : selectedAbilityMode === "rollSets" && rollScoresPool.length
            ? Math.max(...rollScoresPool)
            : Math.max(...currentScores, DEFAULT_ABILITY_MAX);
  const pointBuyCostTable = abilityStepConfig?.pointBuy?.costTable ?? {};
  const pointBuyBaseScore = derivePointBuyBaseScore(
    pointBuyCostTable,
    Number(abilityStepConfig?.pointBuy?.minScore ?? DEFAULT_ABILITY_MIN),
  );
  const defaultPointBuyScores = useMemo(
    () =>
      Object.fromEntries(
        ABILITY_ORDER.map((ability) => [ability, pointBuyBaseScore]),
      ),
    [pointBuyBaseScore],
  );
  const pointCapMin = abilityStepConfig?.pointBuy?.minPointCap ?? 0;
  const pointCapMax = abilityStepConfig?.pointBuy?.maxPointCap ?? 0;
  const pointCapStep = abilityStepConfig?.pointBuy?.pointCapStep ?? 1;
  const pointCapDefault = abilityStepConfig?.pointBuy?.defaultPointCap ?? 0;
  const selectedPointCap = Number.isFinite(Number(abilityMeta.pointCap))
    ? Number(abilityMeta.pointCap)
    : pointCapDefault;
  const pointBuySpent = ABILITY_ORDER.reduce(
    (sum, ability) =>
      sum + Number(pointBuyCostTable[String(state.abilities[ability])] ?? 0),
    0,
  );
  const pointBuyRemaining = selectedPointCap - pointBuySpent;
  const hasInitialAbilityScores = ABILITY_ORDER.every(
    (ability) =>
      Number(state.abilities[ability] ?? DEFAULT_ABILITY_MIN) ===
      Number(initialState.abilities[ability]),
  );

  const applyAbilitySelection = (
    nextScores: Record<string, number>,
    metaPatch?: Partial<{
      mode: AbilityMode;
      pointCap: number;
      rollSets: { generatedSets?: number[][]; selectedSetIndex?: number };
    }>,
  ) => {
    setState((prev) => {
      const prevMeta =
        (prev.selections.abilitiesMeta as
          | Record<string, unknown>
          | undefined) ?? {};
      const nextMode =
        metaPatch?.mode ?? selectedAbilityMode ?? abilityModes[0];
      if (!nextMode)
        return applyChoice(prev, STEP_ID_ABILITIES, nextScores, context);
      const nextMeta = { ...prevMeta, ...metaPatch, mode: nextMode };
      return applyChoice(
        prev,
        STEP_ID_ABILITIES,
        {
          mode: nextMeta.mode,
          pointCap: nextMeta.pointCap,
          rollSets: nextMeta.rollSets,
          scores: nextScores,
        },
        context,
      );
    });
  };

  const setAbility = (key: string, value: number) => {
    if (!Number.isFinite(value)) return;
    applyAbilitySelection({ ...state.abilities, [key]: value });
  };

  const applySelectedRollSet = (set: number[], index: number) => {
    const nextScores = Object.fromEntries(
      ABILITY_ORDER.map((ability, abilityIndex) => [
        ability,
        Number(
          set[abilityIndex] ?? state.abilities[ability] ?? DEFAULT_ABILITY_MIN,
        ),
      ]),
    );
    applyAbilitySelection(nextScores, {
      rollSets: { generatedSets: generatedRollSets, selectedSetIndex: index },
    });
  };

  const regenerateRollSetOptions = () => {
    if (!rollSetsConfig) return;
    const generatedSets = generateRollSets(rollSetsConfig);
    applyAbilitySelection(
      { ...state.abilities },
      { rollSets: { generatedSets, selectedSetIndex: -1 } },
    );
  };

  const stepAbility = (key: string, delta: number) => {
    const current = Number(state.abilities[key] ?? 0);
    const next = clampAbilityScore(
      current + delta,
      abilityMinScore,
      abilityMaxScore,
    );
    if (next === current) return;
    applyAbilitySelection({ ...state.abilities, [key]: next });
  };

  const clampAbilityOnBlur = (key: string) => {
    const current = Number(state.abilities[key]);
    const clamped = clampAbilityScore(
      current,
      abilityMinScore,
      abilityMaxScore,
    );
    if (current === clamped) return;
    applyAbilitySelection({ ...state.abilities, [key]: clamped });
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(computeResult, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${spec.meta.name || DEFAULT_EXPORT_NAME}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAbilityModeChange = (mode: AbilityMode) => {
    if (mode === "rollSets") {
      const currentSets = Array.isArray(abilityMeta.rollSets?.generatedSets)
        ? abilityMeta.rollSets.generatedSets
        : [];
      const generatedSets =
        currentSets.length > 0 ? currentSets : generateRollSets(rollSetsConfig);
      applyAbilitySelection(
        { ...state.abilities },
        {
          mode,
          rollSets: {
            generatedSets,
            selectedSetIndex: selectedRollSetIndex,
          },
        },
      );
      return;
    }
    applyAbilitySelection({ ...state.abilities }, { mode });
  };

  useEffect(() => {
    if (
      currentStep?.kind !== "abilities" ||
      selectedAbilityMode !== "pointBuy"
    ) {
      setIsPointBuyTableOpen(false);
      return;
    }
    if (abilityMeta.mode || !hasInitialAbilityScores) return;
    applyAbilitySelection(defaultPointBuyScores, {
      mode: "pointBuy",
      pointCap: selectedPointCap,
    });
  }, [
    abilityMeta.mode,
    currentStep?.kind,
    defaultPointBuyScores,
    hasInitialAbilityScores,
    selectedAbilityMode,
    selectedPointCap,
  ]);

  const renderCurrentStep = () => {
    if (!currentStep) return null;

    const pageSchema = resolvePageSchemaForStep(
      currentStep,
      context.resolvedData.pageSchemas,
    );
    if (pageSchema) {
      if (currentStep.kind === "review") {
        const reviewSheetData = buildReviewSheetPageData({
          t,
          characterName: spec.meta.name,
          selectedRaceId: String(state.selections.race ?? ""),
          selectedClassId:
            spec.class?.classId ?? String(state.selections.class ?? ""),
          selectedRaceEntity,
          selectedClassEntity,
          reviewData,
          reviewCombat: combatData,
          selectedFeats,
          featsById: context.resolvedData.entities.feats ?? {},
          skills: computeResult.sheetViewModel.data.skills,
          baseAbilityScores: state.abilities,
          provenanceByTargetPath,
          sourceNameByEntityId,
          localizeAbilityLabel,
          localizeEntityText,
          enabledPackIds,
          packVersionById,
          selectedEditionLabel: selectedEdition.label || selectedEdition.id || "-",
          fingerprint: context.resolvedData.fingerprint,
          localizeLoadCategory,
          formatSpeedImpact,
          formatMovementNotes,
          showProvenance: showProv,
          provenanceJson: JSON.stringify(computeResult.provenance ?? [], null, 2),
          onExportJson: exportJson,
          onToggleProvenance: () => setShowProv((s) => !s),
        });

        return (
          <PageComposer
            schema={pageSchema}
            dataRoot={{
              page: {
                reviewSheet: reviewSheetData,
              },
            }}
          />
        );
      }

      if (currentStep.kind === "abilities") {
        const modeSelectorHandlers = createAbilityModeSelectorHandlers({
          hasActiveModeHint: activeAbilityModeHint.length > 0,
          abilityMethodHintPinned,
          abilityMethodHintRef,
          setAbilityMethodHintOpen,
          setAbilityMethodHintPinned,
          isAbilityMode,
          onAbilityModeChange: handleAbilityModeChange,
        });
        const abilitiesAllocatorData = buildAbilitiesAllocatorPageData({
          t,
          title: currentStep.label,
          abilityModes,
          selectedAbilityMode,
          selectedAbilityModeValue,
          modeUi: abilityPresentation?.modeUi ?? {},
          abilityMethodHintOpen,
          modeSelectorHandlers,
          pointBuyPanel:
            selectedAbilityMode === "pointBuy" && abilityStepConfig?.pointBuy
              ? {
                  pointCap: selectedPointCap,
                  pointCapMin,
                  pointCapMax,
                  pointCapStep,
                  pointBuyRemaining,
                  isTableOpen: isPointBuyTableOpen,
                  costTable: pointBuyCostTable,
                  onPointCapChange: (value: number) => {
                    const clamped = Math.min(
                      pointCapMax,
                      Math.max(pointCapMin, value),
                    );
                    applyAbilitySelection(
                      { ...state.abilities },
                      { pointCap: clamped },
                    );
                  },
                  onToggleTable: () => setIsPointBuyTableOpen((prev) => !prev),
                }
              : undefined,
          rollSetsPanel:
            selectedAbilityMode === "rollSets" && rollSetsConfig
              ? {
                  title: t.ROLL_SET_SELECTION_TITLE,
                  description: t.ROLL_SET_SELECTION_DESCRIPTION,
                  rerollLabel: t.ROLL_SET_REROLL_BUTTON,
                  ariaLabel: t.ROLL_SET_OPTIONS_ARIA_LABEL,
                  options: generatedRollSets.map((set, index) => ({
                    id: `roll-set-${index}`,
                    label: [
                      t.ROLL_SET_OPTION_PREFIX,
                      String(index + 1),
                      t.ROLL_SET_OPTION_SUFFIX,
                    ]
                      .filter((part) => part.length > 0)
                      .join(" "),
                    scores: set.join(", "),
                    checked: selectedRollSetIndex === index,
                    onSelect: () => applySelectedRollSet(set, index),
                  })),
                  onReroll: regenerateRollSetOptions,
                }
              : undefined,
          abilityOrder: ABILITY_ORDER,
          abilityScores: state.abilities,
          abilityMinScore,
          abilityMaxScore,
          rollSetNeedsSelection,
          onAbilityChange: setAbility,
          onAbilityBlur: clampAbilityOnBlur,
          onAbilityStep: stepAbility,
          reviewAbilities: reviewData.abilities,
          provenanceByTargetPath,
          sourceMetaByEntityKey,
          localizeAbilityLabel,
          showModifierTable:
            abilityPresentation?.showExistingModifiers ?? true,
          hideZeroGroups:
            abilityPresentation?.hideZeroEffectGroups ?? true,
          sourceTypeLabels: abilityPresentation?.sourceTypeLabels ?? {},
        });

          return (
            <PageComposer
              schema={pageSchema}
              dataRoot={{
                page: {
                  abilitiesAllocator: abilitiesAllocatorData,
                },
              }}
            />
          );
      }

      if (currentStep.kind === "skills") {
        const skillsAllocatorData = buildSkillsAllocatorPageData({
          t,
          title: currentStep.label,
          budget: {
            total: reviewData.skillBudget.total,
            spent: reviewData.skillBudget.spent,
            remaining: reviewData.skillBudget.remaining,
          },
          skills: skillEntities,
          skillViewModelById,
          selectedSkillRanks,
          onCommitRanks: (skillId, nextValue, maxRanks) => {
            const nextRanks = {
              ...selectedSkillRanks,
              [skillId]: Math.min(maxRanks, Math.max(0, nextValue)),
            };
            setState((s) => applyChoice(s, STEP_ID_SKILLS, nextRanks, context));
          },
        });

          return (
            <PageComposer
              schema={pageSchema}
              dataRoot={{
                page: {
                  skillsAllocator: skillsAllocatorData,
                },
              }}
            />
          );
      }

      if (currentStep.kind === "metadata") {
        const metadataName = buildMetadataNameFieldData({
          title: currentStep.label,
          label: t.NAME_LABEL,
          inputId: "character-name-input",
          value: state.metadata.name ?? "",
          placeholder: t.METADATA_PLACEHOLDER,
          onChange: (value: string) => {
            setState((s) => applyChoice(s, currentStep.id, value, context));
          },
        });

        return (
          <PageComposer
            schema={pageSchema}
            dataRoot={{
              page: {
                metadataName,
              },
            }}
          />
        );
      }

      if (currentStep.source.type === "entityType") {
        const stepChoice = choiceMap.get(currentStep.id);
        const options = stepChoice?.options ?? [];
        const limit = stepChoice?.limit ?? currentStep.source.limit ?? 1;

        if (limit <= 1 && currentStep.id !== STEP_ID_FEAT) {
          const currentValue = String(state.selections[currentStep.id] ?? "");
          const entityChoice = buildEntityTypeSingleSelectData({
            title: currentStep.label,
            inputName: currentStep.id,
            options,
            value: currentValue,
            onSelect: (id: string) => {
              setState((s) => applyChoice(s, currentStep.id, id, context));
            },
          });

          return (
            <PageComposer
              schema={pageSchema}
              dataRoot={{
                page: {
                  entityChoice,
                },
              }}
            />
            );
          }
      }
    }

    if (currentStep.kind === "review") {
      const reviewCombat = combatData;
      const abilityOrder = ["str", "dex", "con", "int", "wis", "cha"] as const;
      const statOrder = [
        "hp",
        "ac",
        "initiative",
        "bab",
        "fort",
        "ref",
        "will",
      ] as const;
      const statLabels: Record<(typeof statOrder)[number], string> = {
        hp: t.REVIEW_HP_LABEL,
        ac: t.REVIEW_AC_LABEL,
        initiative: t.REVIEW_INITIATIVE_LABEL,
        bab: t.REVIEW_BAB_LABEL,
        fort: t.REVIEW_FORT_LABEL,
        ref: t.REVIEW_REF_LABEL,
        will: t.REVIEW_WILL_LABEL,
      };
      const statBaseDefaults: Record<(typeof statOrder)[number], number> = {
        hp: DEFAULT_STATS.hp,
        ac: DEFAULT_STATS.ac,
        initiative: DEFAULT_STATS.initiative,
        bab: DEFAULT_STATS.bab,
        fort: DEFAULT_STATS.fort,
        ref: DEFAULT_STATS.ref,
        will: DEFAULT_STATS.will,
      };
      const formatSigned = (value: number) =>
        `${value >= 0 ? "+" : ""}${value}`;
      const formatSkillValue = (value: number) =>
        `${Number.isInteger(value) ? value : value.toFixed(1)}`;
      const formatSourceLabel = (packId: string, entityId: string) =>
        sourceNameByEntityId.get(`${packId}:${entityId}`) ?? t.REVIEW_UNRESOLVED_LABEL;
      const selectedRaceId = String(state.selections.race ?? "");
      const selectedClassId = spec.class?.classId ?? String(state.selections.class ?? "");
      const selectedRaceName = selectedRaceId
        ? localizeEntityText(
            "races",
            selectedRaceId,
            "name",
            selectedRaceEntity?.name ?? t.REVIEW_UNRESOLVED_LABEL,
          )
        : t.REVIEW_UNRESOLVED_LABEL;
      const selectedClassName = selectedClassId
        ? localizeEntityText(
            "classes",
            selectedClassId,
            "name",
            selectedClassEntity?.name ?? t.REVIEW_UNRESOLVED_LABEL,
          )
        : t.REVIEW_UNRESOLVED_LABEL;
      const finalStatValues = {
        hp: reviewData.hp.total,
        ac: reviewCombat.ac.total,
        initiative: reviewData.initiative.total,
        bab: reviewData.bab,
        fort: reviewData.saves.fort.total,
        ref: reviewData.saves.ref.total,
        will: reviewData.saves.will.total,
      } as const;
      const racialTraits = Array.isArray(
        getEntityDataRecord(selectedRaceEntity).racialTraits,
      )
        ? (getEntityDataRecord(selectedRaceEntity).racialTraits as Array<
            Record<string, unknown>
          >)
        : [];
      const reviewSkills = computeResult.sheetViewModel.data.skills
        .filter((skill) => skill.ranks > 0 || skill.racialBonus !== 0)
        .sort((a, b) => {
          const left = localizeEntityText("skills", a.id, "name", a.name);
          const right = localizeEntityText("skills", b.id, "name", b.name);
          return b.total - a.total || left.localeCompare(right);
        });
      const enabledPackDetails = enabledPackIds.map((packId) => ({
        packId,
        version: packVersionById.get(packId) ?? t.REVIEW_UNKNOWN_VERSION,
      }));
      const skillBudget = reviewData.skillBudget;
      return (
        <section className="review-page">
          <h2>{t.REVIEW}</h2>
          <header className="review-hero">
            <div>
              <h3 className="review-character-name">
                {spec.meta.name || t.UNNAMED_CHARACTER}
              </h3>
              <p className="review-character-meta">
                {t.RACE_LABEL}: <strong>{selectedRaceName}</strong> |{" "}
                {t.CLASS_LABEL}: <strong>{selectedClassName}</strong>
              </p>
            </div>
            <div className="review-actions">
              <button onClick={exportJson}>{t.EXPORT_JSON}</button>
              <button onClick={() => setShowProv((s) => !s)}>
                {t.TOGGLE_PROVENANCE}
              </button>
            </div>
          </header>

          <article className="sheet review-decisions">
            <h3>{t.REVIEW_IDENTITY_PROGRESSION}</h3>
            <p>
              {t.REVIEW_LEVEL_LABEL}: {reviewData.identity.level}
            </p>
            <p>
              {t.REVIEW_XP_LABEL}: {reviewData.identity.xp}
            </p>
            <p>
              {t.REVIEW_SIZE_LABEL}: {reviewData.identity.size}
            </p>
            <p>
              {t.REVIEW_SPEED_BASE_LABEL}: {reviewData.identity.speed.base}
            </p>
            <p>
              {t.REVIEW_SPEED_ADJUSTED_LABEL}: {reviewData.identity.speed.adjusted}
            </p>
          </article>

          <div className="review-stat-cards">
            <article className="review-card">
              <h3>{t.REVIEW_AC_LABEL}</h3>
              <p>{String(reviewCombat.ac.total)}</p>
            </article>
            <article className="review-card">
              <h3>{t.REVIEW_AC_TOUCH_LABEL}</h3>
              <p>{String(reviewCombat.ac.touch)}</p>
            </article>
            <article className="review-card">
              <h3>{t.REVIEW_AC_FLAT_FOOTED_LABEL}</h3>
              <p>{String(reviewCombat.ac.flatFooted)}</p>
            </article>
            <article className="review-card">
              <h3>{t.REVIEW_HP_LABEL}</h3>
              <p>{String(reviewData.hp.total)}</p>
            </article>
            <article className="review-card">
              <h3>{t.REVIEW_INITIATIVE_LABEL}</h3>
              <p>{String(reviewData.initiative.total)}</p>
            </article>
            <article className="review-card">
              <h3>{t.REVIEW_GRAPPLE_LABEL}</h3>
              <p>{String(reviewData.grapple.total)}</p>
            </article>
          </div>

          <article className="sheet">
            <h3>{t.REVIEW_SAVE_HP_BREAKDOWN}</h3>
            <table className="review-table">
              <thead>
                <tr>
                  <th>{t.REVIEW_STAT_COLUMN}</th>
                  <th>{t.REVIEW_BASE_COLUMN}</th>
                  <th>{t.REVIEW_ABILITY_COLUMN}</th>
                  <th>{t.REVIEW_ADJUSTMENTS_COLUMN}</th>
                  <th>{t.REVIEW_FINAL_COLUMN}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="review-cell-key">{t.REVIEW_FORT_LABEL}</td>
                  <td>{reviewData.saves.fort.base}</td>
                  <td>{reviewData.saves.fort.ability}</td>
                  <td>{reviewData.saves.fort.misc}</td>
                  <td>{reviewData.saves.fort.total}</td>
                </tr>
                <tr>
                  <td className="review-cell-key">{t.REVIEW_REF_LABEL}</td>
                  <td>{reviewData.saves.ref.base}</td>
                  <td>{reviewData.saves.ref.ability}</td>
                  <td>{reviewData.saves.ref.misc}</td>
                  <td>{reviewData.saves.ref.total}</td>
                </tr>
                <tr>
                  <td className="review-cell-key">{t.REVIEW_WILL_LABEL}</td>
                  <td>{reviewData.saves.will.base}</td>
                  <td>{reviewData.saves.will.ability}</td>
                  <td>{reviewData.saves.will.misc}</td>
                  <td>{reviewData.saves.will.total}</td>
                </tr>
                <tr>
                  <td className="review-cell-key">{t.REVIEW_HP_LABEL}</td>
                  <td>{reviewData.hp.breakdown.hitDie}</td>
                  <td>{reviewData.hp.breakdown.con}</td>
                  <td>{reviewData.hp.breakdown.misc}</td>
                  <td>{reviewData.hp.total}</td>
                </tr>
              </tbody>
            </table>
          </article>

          <article className="sheet">
            <h3>{t.REVIEW_ATTACK_LINES}</h3>
            <table className="review-table">
              <thead>
                <tr>
                  <th>{t.REVIEW_ATTACK_TYPE_COLUMN}</th>
                  <th>{t.REVIEW_ATTACK_ITEM_COLUMN}</th>
                  <th>{t.REVIEW_ATTACK_BONUS_COLUMN}</th>
                  <th>{t.REVIEW_DAMAGE_COLUMN}</th>
                  <th>{t.REVIEW_CRIT_COLUMN}</th>
                  <th>{t.REVIEW_RANGE_COLUMN}</th>
                </tr>
              </thead>
              <tbody>
                {reviewCombat.attacks.map((attack) => (
                  <tr key={`${attack.category}-${attack.itemId}`}>
                    <td className="review-cell-key">
                      {attack.category === "melee"
                        ? t.REVIEW_ATTACK_MELEE_LABEL
                        : t.REVIEW_ATTACK_RANGED_LABEL}
                    </td>
                    <td>{attack.name}</td>
                    <td>{formatSigned(attack.attackBonus)}</td>
                    <td>{attack.damageLine}</td>
                    <td>{attack.crit}</td>
                    <td>
                      {attack.category === "ranged" ? attack.range ?? "-" : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="sheet">
            <h3>{t.REVIEW_FEAT_SUMMARY}</h3>
            {selectedFeats.length === 0 ? (
              <p className="review-muted">-</p>
            ) : (
              <ul className="calc-list">
                {selectedFeats.map((featId) => {
                  const feat = context.resolvedData.entities.feats?.[featId];
                  return (
                  <li key={featId}>
                    <strong>{feat?.name ?? featId}</strong>:{" "}
                    {feat?.summary ?? feat?.description ?? featId}
                  </li>
                  );
                })}
              </ul>
            )}
          </article>

          <article className="sheet">
            <h3>{t.REVIEW_TRAIT_SUMMARY}</h3>
            {racialTraits.length === 0 ? (
              <p className="review-muted">-</p>
            ) : (
              <ul className="calc-list">
                {racialTraits.map((trait, index) => (
                  <li key={`${String(trait.name ?? "")}-${index}`}>
                    <strong>{String(trait.name ?? "")}</strong>:{" "}
                    {String(trait.description ?? "").trim()}
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="sheet">
            <h3>{t.REVIEW_ABILITY_BREAKDOWN}</h3>
            <table className="review-table">
              <caption className="sr-only">
                {t.REVIEW_ABILITY_TABLE_CAPTION}
              </caption>
              <thead>
                <tr>
                  <th>{t.REVIEW_ABILITY_COLUMN}</th>
                  <th>{t.REVIEW_BASE_COLUMN}</th>
                  <th>{t.REVIEW_ADJUSTMENTS_COLUMN}</th>
                  <th>{t.REVIEW_FINAL_COLUMN}</th>
                  <th>{t.REVIEW_MODIFIER_COLUMN}</th>
                </tr>
              </thead>
              <tbody>
                {abilityOrder.map((ability) => {
                  const abilityLabel = localizeAbilityLabel(ability);
                  const baseScore = Number(state.abilities[ability] ?? 10);
                  const targetPath = `abilities.${ability}.score`;
                  const records = provenanceByTargetPath.get(targetPath) ?? [];
                  const finalScore = reviewData.abilities[ability]?.score ?? baseScore;
                  const finalMod = reviewData.abilities[ability]?.mod ?? 0;

                  return (
                    <tr key={ability}>
                      <td className="review-cell-key">{abilityLabel}</td>
                      <td>{baseScore}</td>
                      <td>
                        {records.length === 0 ? (
                          <span className="review-muted">-</span>
                        ) : (
                          <ul className="calc-list">
                            {records.map((record, index) => (
                              <li key={`${targetPath}-${index}`}>
                                <code>
                                  {record.delta !== undefined
                                    ? formatSigned(record.delta)
                                    : `= ${record.setValue ?? 0}`}
                                </code>{" "}
                                {formatSourceLabel(
                                  record.source.packId,
                                  record.source.entityId,
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td>{finalScore}</td>
                      <td>{formatSigned(finalMod)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </article>

          <article className="sheet">
            <h3>{t.REVIEW_COMBAT_BREAKDOWN}</h3>
            <table className="review-table">
              <caption className="sr-only">
                {t.REVIEW_COMBAT_TABLE_CAPTION}
              </caption>
              <thead>
                <tr>
                  <th>{t.REVIEW_STAT_COLUMN}</th>
                  <th>{t.REVIEW_BASE_COLUMN}</th>
                  <th>{t.REVIEW_ADJUSTMENTS_COLUMN}</th>
                  <th>{t.REVIEW_FINAL_COLUMN}</th>
                </tr>
              </thead>
              <tbody>
                {statOrder.map((statKey) => {
                  const targetPath = `stats.${statKey}`;
                  const records = provenanceByTargetPath.get(targetPath) ?? [];
                  const firstSetIndex = records.findIndex(
                    (record) => record.setValue !== undefined,
                  );
                  const baseValue =
                    firstSetIndex >= 0
                      ? Number(
                          records[firstSetIndex]?.setValue ??
                            statBaseDefaults[statKey],
                        )
                      : statBaseDefaults[statKey];
                  const adjustmentRecords = records.filter(
                    (_, index) => index !== firstSetIndex,
                  );

                  return (
                    <tr key={statKey}>
                      <td className="review-cell-key">{statLabels[statKey]}</td>
                      <td>{baseValue}</td>
                      <td>
                        {adjustmentRecords.length === 0 ? (
                          <span className="review-muted">-</span>
                        ) : (
                          <ul className="calc-list">
                            {adjustmentRecords.map((record, index) => (
                              <li key={`${targetPath}-${index}`}>
                                <code>
                                  {record.delta !== undefined
                                    ? formatSigned(record.delta)
                                    : `= ${record.setValue ?? 0}`}
                                </code>{" "}
                                {formatSourceLabel(
                                  record.source.packId,
                                  record.source.entityId,
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td>{String(finalStatValues[statKey])}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </article>

          <article className="sheet">
            <h3>{t.REVIEW_SKILLS_BREAKDOWN}</h3>
            <p className="review-skills-summary">
              {t.REVIEW_POINTS_SPENT_LABEL} {skillBudget.spent} / {skillBudget.total} (
              {skillBudget.remaining} {t.REVIEW_REMAINING_LABEL})
            </p>
            <table className="review-table">
              <caption className="sr-only">
                {t.REVIEW_SKILLS_TABLE_CAPTION}
              </caption>
              <thead>
                <tr>
                  <th>{t.REVIEW_SKILL_COLUMN}</th>
                  <th>{t.REVIEW_RANKS_COLUMN}</th>
                  <th>{t.REVIEW_ABILITY_COLUMN}</th>
                  <th>{t.REVIEW_RACIAL_COLUMN}</th>
                  <th>{t.REVIEW_MISC_COLUMN}</th>
                  <th>{t.REVIEW_ACP_COLUMN}</th>
                  <th>{t.REVIEW_TOTAL_COLUMN}</th>
                  <th>{t.REVIEW_POINT_COST_COLUMN}</th>
                </tr>
              </thead>
              <tbody>
                {reviewSkills.map((skill) => (
                  <tr key={skill.id}>
                    <td className="review-cell-key">
                      {localizeEntityText(
                        "skills",
                        skill.id,
                        "name",
                        skill.name,
                      )}
                    </td>
                    <td>{formatSkillValue(skill.ranks)}</td>
                    <td>
                      {formatSigned(skill.abilityMod)} (
                      {localizeAbilityLabel(skill.abilityKey)})
                    </td>
                    <td>{formatSigned(skill.racialBonus)}</td>
                    <td>{formatSigned(skill.misc)}</td>
                    <td>{formatSigned(skill.acp)}</td>
                    <td>{formatSkillValue(skill.total)}</td>
                    <td>
                      {formatSkillValue(skill.costSpent)} ({skill.costPerRank}
                      {t.REVIEW_PER_RANK_UNIT})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="sheet">
            <h3>{t.REVIEW_EQUIPMENT_LOAD}</h3>
            <p>
              {t.REVIEW_SELECTED_ITEMS_LABEL}:{" "}
              {reviewData.equipmentLoad.selectedItems.length > 0
                ? reviewData.equipmentLoad.selectedItems
                    .map((itemId) =>
                      localizeEntityText("items", itemId, "name", itemId),
                    )
                    .join(", ")
                : "-"}
            </p>
            <p>
              {t.REVIEW_TOTAL_WEIGHT_LABEL}: {reviewData.equipmentLoad.totalWeight}
            </p>
            <p>
              {t.REVIEW_LOAD_CATEGORY_LABEL}:{" "}
              {localizeLoadCategory(reviewData.equipmentLoad.loadCategory)}
            </p>
            <p>
              {t.REVIEW_SPEED_IMPACT_LABEL}:{" "}
              {formatSpeedImpact(
                reviewData.speed.adjusted,
                reviewData.equipmentLoad.reducesSpeed,
              )}
            </p>
          </article>

          <article className="sheet">
            <h3>{t.REVIEW_MOVEMENT_DETAIL}</h3>
            <p>
              {t.REVIEW_SPEED_BASE_LABEL}: {reviewData.speed.base}
            </p>
            <p>
              {t.REVIEW_SPEED_ADJUSTED_LABEL}: {reviewData.speed.adjusted}
            </p>
            <p>
              {t.REVIEW_MOVEMENT_NOTES_LABEL}:{" "}
              {formatMovementNotes(reviewData.movement.reducedByArmorOrLoad).join("; ")}
            </p>
          </article>

          <article className="sheet review-decisions">
            <h3>{t.REVIEW_RULES_DECISIONS}</h3>
            <p>
              {t.REVIEW_FAVORED_CLASS_LABEL}:{" "}
              {reviewData.rulesDecisions.favoredClass
                ? reviewData.rulesDecisions.favoredClass === "any"
                  ? t.REVIEW_FAVORED_CLASS_ANY
                  : localizeEntityText(
                      "classes",
                      reviewData.rulesDecisions.favoredClass,
                      "name",
                      reviewData.rulesDecisions.favoredClass,
                    )
                : t.REVIEW_UNRESOLVED_LABEL}
            </p>
            <p>
              {t.REVIEW_MULTICLASS_XP_IGNORED_LABEL}:{" "}
              {reviewData.rulesDecisions.ignoresMulticlassXpPenalty
                ? t.REVIEW_YES
                : t.REVIEW_NO}
            </p>
            <p>
              {t.REVIEW_FEAT_SLOTS_LABEL}: {reviewData.rulesDecisions.featSelectionLimit}
            </p>
          </article>

          <article className="sheet review-decisions">
            <h3>{t.REVIEW_PACK_INFO}</h3>
            <p>
              {t.REVIEW_SELECTED_EDITION_LABEL}:{" "}
              {selectedEdition.label || selectedEdition.id || "-"}
            </p>
            <p>{t.REVIEW_ENABLED_PACKS_LABEL}:</p>
            <ul>
              {enabledPackDetails.map((pack) => (
                <li key={pack.packId}>
                  {pack.packId} ({pack.version})
                </li>
              ))}
            </ul>
            <p>
              {t.REVIEW_FINGERPRINT_LABEL}:{" "}
              <code>{context.resolvedData.fingerprint}</code>
            </p>
          </article>

          {showProv && (
            <article className="sheet">
              <h3>{t.REVIEW_RAW_PROVENANCE}</h3>
              <pre>{JSON.stringify(computeResult.provenance ?? [], null, 2)}</pre>
            </article>
          )}
        </section>
      );
    }

    if (currentStep.kind === "metadata") {
      return (
        <section>
          <h2>{currentStep.label}</h2>
          <label htmlFor="character-name-input">{t.NAME_LABEL}</label>
          <input
            id="character-name-input"
            value={state.metadata.name ?? ""}
            onChange={(e) =>
              setState((s) =>
                applyChoice(s, currentStep.id, e.target.value, context),
              )
            }
            placeholder={t.METADATA_PLACEHOLDER}
            aria-label={t.NAME_LABEL}
          />
        </section>
      );
    }

    if (currentStep.source.type === "entityType") {
      const stepChoice = choiceMap.get(currentStep.id);
      const options = stepChoice?.options ?? [];
      const limit = stepChoice?.limit ?? currentStep.source.limit ?? 1;

      const handleSingleSelect = (id: string) => {
        if (currentStep.id === STEP_ID_FEAT) {
          setState((s) => applyChoice(s, currentStep.id, [id], context));
          return;
        }
        setState((s) => applyChoice(s, currentStep.id, id, context));
      };

      if (limit <= 1) {
        const currentValue =
          currentStep.id === STEP_ID_FEAT
            ? String(selectedFeats[0] ?? "")
            : String(state.selections[currentStep.id] ?? "");

        return (
          <Picker
            title={currentStep.label}
            options={options}
            value={currentValue}
            onSelect={handleSingleSelect}
          />
        );
      }

      const selected = selectedStepValues(currentStep.id);
      return (
        <section>
          <h2>{currentStep.label}</h2>
          <fieldset>
            <legend>{currentStep.label}</legend>
            {options.map((o) => (
              <label key={o.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(o.id)}
                  disabled={
                    !selected.includes(o.id) && selected.length >= limit
                  }
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selected, o.id]
                      : selected.filter((item) => item !== o.id);
                    setState((s) =>
                      applyChoice(s, currentStep.id, next, context),
                    );
                  }}
                />
                {o.label}
              </label>
            ))}
          </fieldset>
        </section>
      );
    }

    throw new Error(`Unknown flow step kind: ${currentStep.kind}`);
  };

  if (role !== "player") {
    return (
      <RoleSelectionGate
        role={role}
        onChange={setRole}
        language={language}
        onLanguageChange={setLanguage}
        text={t}
      />
    );
  }

  if (!rulesReady) {
    return (
      <RulesSetupGate
        language={language}
        onLanguageChange={setLanguage}
        text={t}
        editions={EDITIONS}
        selectedEditionId={selectedEditionId}
        onEditionChange={(editionId) => {
          setSelectedEditionId(editionId);
          setSelectedOptionalPackIds([]);
          setState(initialState);
          setStepIndex(0);
        }}
        selectedOptionalPackIds={selectedOptionalPackIds}
        onOptionalPackToggle={(packId) => {
          setSelectedOptionalPackIds((current) =>
            current.includes(packId)
              ? current.filter((id) => id !== packId)
              : [...current, packId],
          );
          setState(initialState);
          setStepIndex(0);
        }}
        onBack={() => {
          setRulesReady(false);
          setRole(null);
        }}
        onStart={() => {
          setState(initialState);
          setStepIndex(0);
          setShowProv(false);
          setRulesReady(true);
        }}
      />
    );
  }

  return (
    <main
      className={`container ${language === "zh" ? "lang-zh" : ""}`}
      lang={language}
    >
      <LanguageSwitch
        language={language}
        onLanguageChange={setLanguage}
        text={t}
      />
      <h1>{t.APP_TITLE}</h1>
      <p className="subtitle">{t.APP_SUBTITLE}</p>
      <p>
        {t.STEP_COUNTER} {stepIndex + 1} / {wizardSteps.length}
      </p>
      {renderCurrentStep()}
      <footer className="actions">
        <button
          onClick={() => {
            if (stepIndex === 0) {
              setRulesReady(false);
              return;
            }
            setStepIndex((s) => s - 1);
          }}
        >
          {t.BACK}
        </button>
        <button
          disabled={stepIndex === wizardSteps.length - 1}
          onClick={() => setStepIndex((s) => s + 1)}
        >
          {t.NEXT}
        </button>
      </footer>
    </main>
  );
}

function RulesSetupGate({
  language,
  onLanguageChange,
  text,
  editions,
  selectedEditionId,
  onEditionChange,
  selectedOptionalPackIds,
  onOptionalPackToggle,
  onBack,
  onStart,
}: {
  language: Language;
  onLanguageChange: (language: Language) => void;
  text: UIText;
  editions: EditionOption[];
  selectedEditionId: string;
  onEditionChange: (editionId: string) => void;
  selectedOptionalPackIds: string[];
  onOptionalPackToggle: (packId: string) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  const selectedEdition =
    editions.find((edition) => edition.id === selectedEditionId) ??
    editions[0] ??
    FALLBACK_EDITION;

  return (
    <main
      className={`container ${language === "zh" ? "lang-zh" : ""}`}
      lang={language}
    >
      <LanguageSwitch
        language={language}
        onLanguageChange={onLanguageChange}
        text={text}
      />
      <h1>{text.RULES_SETUP_TITLE}</h1>
      <section>
        <label htmlFor="edition-select">{text.EDITION_LABEL}</label>
        <select
          id="edition-select"
          value={selectedEditionId}
          onChange={(event) => onEditionChange(event.target.value)}
        >
          {editions.map((edition) => (
            <option key={edition.id} value={edition.id}>
              {edition.label}
            </option>
          ))}
        </select>
      </section>
      <section>
        <h2>{text.SOURCES_LABEL}</h2>
        <input
          id="base-pack-checkbox"
          type="checkbox"
          checked
          disabled
          aria-label={`${selectedEdition.basePackId} (${text.BASE_SOURCE_LOCKED_LABEL})`}
        />
        <label htmlFor="base-pack-checkbox">
          {selectedEdition.basePackId} ({text.BASE_SOURCE_LOCKED_LABEL})
        </label>
        {selectedEdition.optionalPackIds.length === 0 && <p>-</p>}
        {selectedEdition.optionalPackIds.map((packId) => (
          <label key={packId}>
            <input
              type="checkbox"
              checked={selectedOptionalPackIds.includes(packId)}
              onChange={() => onOptionalPackToggle(packId)}
            />
            {packId}
          </label>
        ))}
      </section>
      <footer className="actions">
        <button onClick={onBack}>{text.BACK}</button>
        <button onClick={onStart}>{text.START_WIZARD}</button>
      </footer>
    </main>
  );
}

function RoleSelectionGate({
  role,
  onChange,
  language,
  onLanguageChange,
  text,
}: {
  role: Role;
  onChange: (value: Role) => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  text: UIText;
}) {
  return (
    <main
      className={`role-gate ${language === "zh" ? "lang-zh" : ""}`}
      lang={language}
    >
      <section className="role-tabs-root">
        <LanguageSwitch
          language={language}
          onLanguageChange={onLanguageChange}
          text={text}
        />
        <div className="role-tabs-grid" role="group" aria-label={text.ROLE_ARIA}>
          <button
            type="button"
            aria-pressed={role === "dm"}
            className={`role-tab role-tab-left ${role === "dm" ? "active" : ""}`}
            onClick={() => onChange("dm")}
          >
            <span className="role-tab-title">{text.DM_TITLE}</span>
            <span className="role-tab-subtitle">{text.DM_SUBTITLE}</span>
          </button>
          <button
            type="button"
            aria-pressed={role === "player"}
            className={`role-tab role-tab-right ${role === "player" ? "active" : ""}`}
            onClick={() => onChange("player")}
          >
            <span className="role-tab-title">{text.PLAYER_TITLE}</span>
            <span className="role-tab-subtitle">{text.PLAYER_SUBTITLE}</span>
          </button>
        </div>
        <div className="role-copy-overlay">
          <h1 className="role-question tabs-overlay">{text.ROLE_QUESTION}</h1>
          <p className="role-intro tabs-intro">{text.ROLE_INTRO}</p>
        </div>
        {role === "dm" && (
          <p className="role-message" aria-live="polite">
            {text.DM_UNSUPPORTED}
          </p>
        )}
      </section>
    </main>
  );
}

function LanguageSwitch({
  language,
  onLanguageChange,
  text,
}: {
  language: Language;
  onLanguageChange: (language: Language) => void;
  text: UIText;
}) {
  return (
    <div
      className="language-switch"
      role="radiogroup"
      aria-label={text.LANGUAGE_LABEL}
    >
      <label className={`lang-btn ${language === "en" ? "active" : ""}`}>
        <input
          className="lang-radio"
          type="radio"
          name="language-switch"
          value="en"
          checked={language === "en"}
          onChange={() => onLanguageChange("en")}
        />
        <span>{text.ENGLISH}</span>
      </label>
      <label className={`lang-btn ${language === "zh" ? "active" : ""}`}>
        <input
          className="lang-radio"
          type="radio"
          name="language-switch"
          value="zh"
          checked={language === "zh"}
          onChange={() => onLanguageChange("zh")}
        />
        <span>{text.CHINESE}</span>
      </label>
    </div>
  );
}

function Picker({
  title,
  options,
  value,
  onSelect,
}: {
  title: string;
  options: Array<{ id: string; label: string }>;
  value: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section>
      <h2>{title}</h2>
      {options.map((o) => (
        <label key={o.id}>
          <input
            type="radio"
            name={title}
            checked={value === o.id}
            onChange={() => onSelect(o.id)}
          />
          {o.label}
        </label>
      ))}
    </section>
  );
}
