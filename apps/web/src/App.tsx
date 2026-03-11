import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveLoadedPacks } from "@dcb/datapack";
import { loadMinimalPack } from "./loadMinimalPack";
import {
  DEFAULT_STATS,
  applyChoice,
  compute,
  initialState,
  listChoices,
  type CharacterState,
} from "@dcb/engine";
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
import { AbilityMethodSelector } from "./components/AbilityMethodSelector";
import { EntityChoiceStep } from "./components/EntityChoiceStep";
import { PointBuyPanel } from "./components/PointBuyPanel";
import { ReviewStep } from "./components/ReviewStep";
import { characterSpecFromState } from "./characterSpecFromState";
import {
  buildSkillBudgetSummary,
  clampAbilityScore,
  derivePointBuyBaseScore,
  generateRollSets,
  getCharacterLevel,
  getClassSkillIds,
  getRacialSkillBonuses,
  getSkillMaxRanksForLevel,
  type AbilityMode,
  type AbilityPresentationConfig,
  type AbilityStepConfig,
  type LocalSkillUiDetail,
} from "./appHelpers";
import {
  getSingleSelectedValue,
  getStepSelectionValues,
  localizeChoices,
  localizeWizardSteps,
} from "./wizardStepHelpers";

const embeddedPacks = [loadMinimalPack()];
type Role = "dm" | "player" | null;

const STEP_ID_FEAT = "feat";
const STEP_ID_SKILLS = "skills";
const STEP_ID_ABILITIES = "abilities";
const DEFAULT_EXPORT_NAME = "character";
const ABILITY_ORDER = ["str", "dex", "con", "int", "wis", "cha"] as const;
const DEFAULT_ABILITY_MIN = 3;
const DEFAULT_ABILITY_MAX = 18;

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
      localizeWizardSteps(
        context.resolvedData.flow.steps,
        activeLocale?.flowStepLabels,
      ),
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
      localizeChoices({
        choices,
        wizardSteps,
        flowStepLabels: activeLocale?.flowStepLabels,
        localizeEntityText,
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
  const classSkillIds = useMemo(
    () => getClassSkillIds(selectedClassEntity),
    [selectedClassEntity],
  );
  const racialSkillBonuses = useMemo(
    () => getRacialSkillBonuses(selectedRaceEntity),
    [selectedRaceEntity],
  );
  const skillBudget = useMemo(
    () =>
      buildSkillBudgetSummary({
        classEntity: selectedClassEntity,
        classSelection: spec.class,
        raceEntity: selectedRaceEntity,
        intMod: reviewData.abilities.int?.mod ?? 0,
        skillRanks: selectedSkillRanks,
        classSkillIds,
      }),
    [
      classSkillIds,
      reviewData.abilities.int,
      selectedClassEntity,
      selectedRaceEntity,
      selectedSkillRanks,
      spec.class,
    ],
  );
  const skillUiDetailById = useMemo(() => {
    const level = getCharacterLevel(spec.class);
    return new Map(
      skillEntities.map((skill) => {
        const classSkill = classSkillIds.has(skill.id);
        const costPerRank = classSkill ? 1 : 2;
        const ranks = selectedSkillRanks[skill.id] ?? 0;
        return [
          skill.id,
          {
            classSkill,
            costPerRank,
            costSpent: ranks * costPerRank,
            maxRanks: getSkillMaxRanksForLevel(level, classSkill),
            racialBonus: racialSkillBonuses.get(skill.id) ?? 0,
          } satisfies LocalSkillUiDetail,
        ] as const;
      }),
    );
  }, [
    classSkillIds,
    racialSkillBonuses,
    selectedSkillRanks,
    skillEntities,
    spec.class,
  ]);

  const selectedStepValues = (stepId: string): string[] =>
    getStepSelectionValues({
      stepId,
      selections: state.selections,
      featStepId: STEP_ID_FEAT,
    });

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

    if (currentStep.kind === "review") {
      return (
        <ReviewStep
          text={t}
          state={state}
          spec={spec}
          computeResult={computeResult}
          reviewData={reviewData}
          combatData={combatData}
          entities={context.resolvedData.entities}
          selectedEdition={selectedEdition}
          fingerprint={context.resolvedData.fingerprint}
          selectedFeats={selectedFeats}
          selectedRaceEntity={selectedRaceEntity}
          selectedClassEntity={selectedClassEntity}
          skillUiDetailById={skillUiDetailById}
          provenanceByTargetPath={provenanceByTargetPath}
          sourceNameByEntityId={sourceNameByEntityId}
          packVersionById={packVersionById}
          enabledPackIds={enabledPackIds}
          showProv={showProv}
          onToggleProvenance={() => setShowProv((current) => !current)}
          onExportJson={exportJson}
          localizeLoadCategory={localizeLoadCategory}
          formatSpeedImpact={formatSpeedImpact}
          formatMovementNotes={formatMovementNotes}
          localizeAbilityLabel={localizeAbilityLabel}
          localizeEntityText={localizeEntityText}
        />
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

    if (currentStep.kind === "abilities") {
      const formatSigned = (value: number) =>
        `${value >= 0 ? "+" : ""}${value}`;
      const showModifierTable =
        abilityPresentation?.showExistingModifiers ?? true;
      const sourceTypeLabels = abilityPresentation?.sourceTypeLabels ?? {};
      const hideZeroGroups = abilityPresentation?.hideZeroEffectGroups ?? true;
      const groupLabel = (sourceType: string) =>
        sourceTypeLabels[sourceType] ??
        (sourceType === "unknown" ? t.REVIEW_UNRESOLVED_LABEL : sourceType);
      const modeUi = abilityPresentation?.modeUi ?? {};
      const textMap = t as unknown as Record<string, unknown>;
      const defaultModeLabel = (mode: AbilityMode) =>
        mode === "pointBuy"
          ? t.ABILITY_MODE_POINT_BUY
          : mode === "phb"
            ? t.ABILITY_MODE_PHB
            : t.ABILITY_MODE_ROLL_SETS;
      const normalizeUITextKey = (key?: string) => {
        if (!key) return undefined;
        return key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();
      };
      const getModeLabel = (mode: AbilityMode) => {
        const key = modeUi[mode]?.labelKey;
        const fromKey = key ? textMap[key] : undefined;
        const normalized = normalizeUITextKey(key);
        const fromNormalized = normalized ? textMap[normalized] : undefined;
        const value = fromKey ?? fromNormalized;
        return typeof value === "string" && value.length > 0
          ? value
          : defaultModeLabel(mode);
      };
      const getModeHint = (mode: AbilityMode) => {
        const key = modeUi[mode]?.hintKey;
        const fromKey = key ? textMap[key] : undefined;
        const normalized = normalizeUITextKey(key);
        const fromNormalized = normalized ? textMap[normalized] : undefined;
        const value = fromKey ?? fromNormalized;
        return typeof value === "string" ? value : "";
      };
      const hintMode = selectedAbilityMode ?? abilityModes[0];
      const activeModeHint = hintMode ? getModeHint(hintMode) : "";
      const hasActiveModeHint = activeModeHint.length > 0;
      const isHintVisible = abilityMethodHintOpen && hasActiveModeHint;
      const handleAbilityModeChange = (mode: AbilityMode) => {
        if (mode === "rollSets") {
          const currentSets = Array.isArray(abilityMeta.rollSets?.generatedSets)
            ? abilityMeta.rollSets.generatedSets
            : [];
          const generatedSets =
            currentSets.length > 0
              ? currentSets
              : generateRollSets(rollSetsConfig);
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

      return (
        <section>
          <h2>{currentStep.label}</h2>
          <AbilityMethodSelector
            label={t.ABILITY_GENERATION_LABEL}
            helpLabel={t.ABILITY_METHOD_HELP_LABEL}
            helpText={activeModeHint}
            isHintVisible={isHintVisible}
            isHintAvailable={hasActiveModeHint}
            value={selectedAbilityModeValue}
            options={abilityModes.map((mode) => ({
              value: mode,
              label: getModeLabel(mode),
            }))}
            onMouseEnter={() => {
              if (!hasActiveModeHint) return;
              setAbilityMethodHintOpen(true);
            }}
            onMouseLeave={() => {
              if (abilityMethodHintPinned) return;
              const activeElement = document.activeElement as Node | null;
              if (
                activeElement &&
                abilityMethodHintRef.current?.contains(activeElement)
              )
                return;
              setAbilityMethodHintOpen(false);
            }}
            onFocus={() => {
              if (!hasActiveModeHint) return;
              setAbilityMethodHintOpen(true);
            }}
            onBlur={(event) => {
              if (abilityMethodHintPinned) return;
              const next = event.relatedTarget as Node | null;
              if (next && abilityMethodHintRef.current?.contains(next)) return;
              setAbilityMethodHintOpen(false);
            }}
            onClick={() => {
              if (!hasActiveModeHint) return;
              if (abilityMethodHintPinned) {
                setAbilityMethodHintPinned(false);
                setAbilityMethodHintOpen(false);
              } else {
                setAbilityMethodHintPinned(true);
                setAbilityMethodHintOpen(true);
              }
            }}
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              setAbilityMethodHintPinned(false);
              setAbilityMethodHintOpen(false);
            }}
            onChange={(value) => {
              if (!isAbilityMode(value)) return;
              handleAbilityModeChange(value);
            }}
            helpRef={abilityMethodHintRef}
          />
          {selectedAbilityMode === "pointBuy" &&
            abilityStepConfig?.pointBuy && (
              <PointBuyPanel
                pointCapLabel={t.POINT_CAP_LABEL}
                pointCap={selectedPointCap}
                pointCapMin={pointCapMin}
                pointCapMax={pointCapMax}
                pointCapStep={pointCapStep}
                pointBuyRemainingLabel={t.POINT_BUY_REMAINING_LABEL}
                pointBuyRemaining={pointBuyRemaining}
                showTableLabel={t.POINT_BUY_SHOW_TABLE_LABEL}
                hideTableLabel={t.POINT_BUY_HIDE_TABLE_LABEL}
                tableCaption={t.POINT_BUY_TABLE_CAPTION}
                scoreColumnLabel={t.POINT_BUY_SCORE_COLUMN}
                costColumnLabel={t.POINT_BUY_COST_COLUMN}
                isTableOpen={isPointBuyTableOpen}
                costTable={pointBuyCostTable}
                onPointCapChange={(value) => {
                  const clamped = Math.min(
                    pointCapMax,
                    Math.max(pointCapMin, value),
                  );
                  applyAbilitySelection(
                    { ...state.abilities },
                    { pointCap: clamped },
                  );
                }}
                onToggleTable={() => setIsPointBuyTableOpen((prev) => !prev)}
              />
            )}
          {selectedAbilityMode === "rollSets" && rollSetsConfig && (
            <section className="sheet">
              <div className="rollsets-header">
                <h3>{t.ROLL_SET_SELECTION_TITLE}</h3>
                <button type="button" onClick={regenerateRollSetOptions}>
                  {t.ROLL_SET_REROLL_BUTTON}
                </button>
              </div>
              <p>{t.ROLL_SET_SELECTION_DESCRIPTION}</p>
              <fieldset
                role="radiogroup"
                aria-label={t.ROLL_SET_OPTIONS_ARIA_LABEL}
              >
                {generatedRollSets.map((set, index) => (
                  <label key={`roll-set-${index}`} className="rollset-option">
                    <input
                      type="radio"
                      name="roll-set-choice"
                      checked={selectedRollSetIndex === index}
                      onChange={() => applySelectedRollSet(set, index)}
                    />
                    <span>
                      {[t.ROLL_SET_OPTION_PREFIX, String(index + 1), t.ROLL_SET_OPTION_SUFFIX]
                        .filter((part) => part.length > 0)
                        .join(" ")}
                    </span>
                    <code>{set.join(", ")}</code>
                  </label>
                ))}
              </fieldset>
            </section>
          )}
          <div className="grid">
            {ABILITY_ORDER.map((key) => {
              const value = Number(state.abilities[key] ?? 0);
              const label = localizeAbilityLabel(key);
              const canEditAbility = !rollSetNeedsSelection;
              const canDecrease = canEditAbility && value > abilityMinScore;
              const canIncrease = canEditAbility && value < abilityMaxScore;
              return (
                <div key={key} className="ability-input-row">
                  <label htmlFor={`ability-input-${key}`}>{label}</label>
                  <div className="ability-stepper">
                    <button
                      type="button"
                      className="ability-step-btn"
                      aria-label={`${t.DECREASE_LABEL} ${label}`}
                      disabled={!canDecrease}
                      onClick={() => stepAbility(key, -1)}
                    >
                      -
                    </button>
                    <input
                      id={`ability-input-${key}`}
                      type="number"
                      disabled={!canEditAbility}
                      min={abilityMinScore}
                      max={abilityMaxScore}
                      step={1}
                      value={value}
                      onChange={(e) => setAbility(key, Number(e.target.value))}
                      onBlur={() => clampAbilityOnBlur(key)}
                    />
                    <button
                      type="button"
                      className="ability-step-btn"
                      aria-label={`${t.INCREASE_LABEL} ${label}`}
                      disabled={!canIncrease}
                      onClick={() => stepAbility(key, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {showModifierTable && (
            <article className="sheet">
              <h3>{t.ABILITY_EXISTING_MODIFIERS_LABEL}</h3>
              <table className="review-table">
                <thead>
                  <tr>
                    <th>{t.REVIEW_ABILITY_COLUMN}</th>
                    <th>{t.REVIEW_BASE_COLUMN}</th>
                    <th>{t.ABILITY_EXISTING_MODIFIERS_LABEL}</th>
                    <th>{t.REVIEW_FINAL_COLUMN}</th>
                    <th>{t.REVIEW_MODIFIER_COLUMN}</th>
                  </tr>
                </thead>
                <tbody>
                  {ABILITY_ORDER.map((ability) => {
                    const targetPath = `abilities.${ability}.score`;
                    const records =
                      provenanceByTargetPath.get(targetPath) ?? [];
                    const baseScore = Number(state.abilities[ability] ?? 10);
                    const adjustment = records.reduce(
                      (sum, record) => sum + Number(record.delta ?? 0),
                      0,
                    );
                    const grouped = new Map<
                      string,
                      Array<{ sourceLabel: string; delta: number }>
                    >();
                    for (const record of records) {
                      const delta = Number(record.delta ?? 0);
                      if (!Number.isFinite(delta)) continue;
                      const meta = sourceMetaByEntityKey.get(
                        `${record.source.packId}:${record.source.entityId}`,
                      );
                      const sourceType = meta?.sourceType ?? "unknown";
                      const sourceLabel =
                        meta?.sourceLabel ?? t.REVIEW_UNRESOLVED_LABEL;
                      const list = grouped.get(sourceType) ?? [];
                      list.push({ sourceLabel, delta });
                      grouped.set(sourceType, list);
                    }
                    const groupsToRender = Array.from(grouped.entries())
                      .map(([sourceType, items]) => ({
                        sourceType,
                        items,
                        total: items.reduce((sum, item) => sum + item.delta, 0),
                      }))
                      .filter((group) => !hideZeroGroups || group.total !== 0);
                    const finalScore = Number(
                      reviewData.abilities[ability]?.score ?? baseScore,
                    );
                    const finalMod = Number(
                      reviewData.abilities[ability]?.mod ?? 0,
                    );
                    return (
                      <tr key={ability}>
                        <td>{localizeAbilityLabel(ability)}</td>
                        <td>{baseScore}</td>
                        <td>
                          <div>{formatSigned(adjustment)}</div>
                          {groupsToRender.length > 0 && (
                            <ul className="calc-list">
                              {groupsToRender.map((group) => (
                                <li key={`${ability}-${group.sourceType}`}>
                                  <strong>
                                    {groupLabel(group.sourceType)}
                                  </strong>
                                  : {formatSigned(group.total)}
                                  <ul className="calc-list">
                                    {group.items.map((item, index) => (
                                      <li
                                        key={`${ability}-${group.sourceType}-${index}`}
                                      >
                                        <code>{formatSigned(item.delta)}</code>{" "}
                                        {item.sourceLabel}
                                      </li>
                                    ))}
                                  </ul>
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
          )}
        </section>
      );
    }

    if (currentStep.kind === "skills") {
      const formatSkillValue = (value: number) =>
        `${Number.isInteger(value) ? value : value.toFixed(1)}`;
      const skillControlLabel = (
        action: "increase" | "decrease",
        skillName: string,
      ) =>
        `${action === "increase" ? t.INCREASE_LABEL : t.DECREASE_LABEL} ${skillName}`;
      const skillBudget = reviewData.skillBudget;

      return (
        <section>
          <h2>{currentStep.label}</h2>
          <p className="skill-points-summary">
            {t.SKILLS_BUDGET_LABEL}: {skillBudget.total} | {t.SKILLS_SPENT_LABEL}:{" "}
            {skillBudget.spent} | {t.SKILLS_REMAINING_LABEL}: {skillBudget.remaining}
          </p>
          <div className="skills-table-wrap">
            <table className="review-table skills-table">
              <thead>
                <tr>
                  <th>{t.REVIEW_SKILL_COLUMN}</th>
                  <th>{t.SKILLS_TYPE_COLUMN}</th>
                  <th>{t.SKILLS_POINTS_COLUMN}</th>
                  <th>{t.SKILLS_RANKS_COLUMN}</th>
                  <th>{t.SKILLS_BREAKDOWN_COLUMN}</th>
                  <th>{t.REVIEW_TOTAL_COLUMN}</th>
                  <th>{t.SKILLS_NOTES_COLUMN}</th>
                </tr>
              </thead>
              <tbody>
                {skillEntities.map((skill) => {
                  const skillView = skillViewModelById.get(skill.id);
                  const ranks = selectedSkillRanks[skill.id] ?? 0;
                  const classSkill = skillView?.classSkill ?? false;
                  const costPerRank = skillView?.costPerRank ?? 2;
                  const maxRanks = skillView?.maxRanks ?? 0;
                  const racialBonus = skillView?.racialBonus ?? 0;
                  const miscBonus = skillView?.misc ?? 0;
                  const acpPenalty = skillView?.acp ?? 0;
                  const abilityMod = skillView?.abilityMod ?? 0;
                  const total = skillView?.total ?? 0;
                  const rankStep = classSkill ? 1 : 0.5;
                  const costToIncrease = rankStep * costPerRank;
                  const armorCheckPenaltyApplies =
                    skillView?.acpApplied ??
                    Boolean(skill.data?.armorCheckPenaltyApplies);
                  const canDecrease = ranks > 0;
                  const canIncrease =
                    ranks + rankStep <= maxRanks &&
                    skillBudget.remaining + 1e-9 >= costToIncrease;

                  const updateRanks = (nextValue: number) => {
                    const nextRanks = {
                      ...selectedSkillRanks,
                      [skill.id]: Math.min(maxRanks, Math.max(0, nextValue)),
                    };
                    setState((s) =>
                      applyChoice(s, STEP_ID_SKILLS, nextRanks, context),
                    );
                  };

                  return (
                    <tr key={skill.id}>
                      <td className="review-cell-key">{skill.displayName}</td>
                      <td>
                        {classSkill ? t.SKILLS_CLASS_LABEL : t.SKILLS_CROSS_LABEL}
                      </td>
                      <td>
                        {costPerRank}
                        {t.SKILLS_PER_RANK_UNIT}
                      </td>
                      <td>
                        <div className="skill-rank-stepper">
                          <button
                            type="button"
                            className="ability-step-btn"
                            aria-label={skillControlLabel(
                              "decrease",
                              skill.displayName,
                            )}
                            disabled={!canDecrease}
                            onClick={() => updateRanks(ranks - rankStep)}
                          >
                            -
                          </button>
                          <output
                            aria-label={`${skill.displayName} ranks`}
                            className="skill-rank-value"
                          >
                            {formatSkillValue(ranks)}
                          </output>
                          <button
                            type="button"
                            className="ability-step-btn"
                            aria-label={skillControlLabel(
                              "increase",
                              skill.displayName,
                            )}
                            disabled={!canIncrease}
                            onClick={() => updateRanks(ranks + rankStep)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>
                        {formatSkillValue(ranks)} +{" "}
                        {formatSkillValue(abilityMod)} +{" "}
                        {formatSkillValue(miscBonus)} -{" "}
                        {formatSkillValue(Math.abs(acpPenalty))} ={" "}
                        {formatSkillValue(total)}
                      </td>
                      <td>{formatSkillValue(total)}</td>
                      <td>
                        <div>
                          {t.SKILLS_MAX_LABEL} {formatSkillValue(maxRanks)}
                        </div>
                        <div>
                          {t.SKILLS_RACIAL_LABEL} {racialBonus >= 0 ? "+" : ""}
                          {formatSkillValue(racialBonus)}
                        </div>
                        <div>
                          {armorCheckPenaltyApplies
                            ? t.SKILLS_ACP_APPLIES_LABEL
                            : t.SKILLS_ACP_NOT_APPLICABLE_LABEL}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (currentStep.source.type === "entityType") {
      const stepChoice = choiceMap.get(currentStep.id);
      const options = stepChoice?.options ?? [];
      const limit = stepChoice?.limit ?? currentStep.source.limit ?? 1;
      return (
        <EntityChoiceStep
          title={currentStep.label}
          options={options}
          limit={limit}
          selected={
            limit <= 1
              ? [
                  getSingleSelectedValue({
                    stepId: currentStep.id,
                    selections: state.selections,
                    featStepId: STEP_ID_FEAT,
                  }),
                ].filter(Boolean)
              : selectedStepValues(currentStep.id)
          }
          onChange={(nextSelected) => {
            if (limit <= 1) {
              const nextValue = nextSelected[0] ?? "";
              if (currentStep.id === STEP_ID_FEAT) {
                setState((current) =>
                  applyChoice(current, currentStep.id, nextValue ? [nextValue] : [], context),
                );
                return;
              }
              setState((current) =>
                applyChoice(current, currentStep.id, nextValue, context),
              );
              return;
            }

            setState((current) =>
              applyChoice(current, currentStep.id, nextSelected, context),
            );
          }}
        />
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

