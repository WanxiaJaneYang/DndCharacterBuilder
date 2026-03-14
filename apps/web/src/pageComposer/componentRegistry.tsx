import type { ReactNode } from "react";
import { AbilityAllocatorBlock, SkillsAllocatorBlock } from "./allocatorBlocks";
import {
  EntityTypeSingleSelectBlock,
  MetadataNameFieldBlock,
  SingleColumnLayout,
  type RegistryComponentProps,
} from "./baseBlocks";
import { ReviewSheetBlock } from "./legacyReviewSheetBlock";
import {
  ReviewCombatBlock,
  ReviewSaveHpBlock,
  ReviewSkillsBlock,
  ReviewTableAttacksBlock,
  ReviewTableAbilitiesBlock,
} from "./reviewTableBlocks";
import {
  ReviewDecisionsBlock,
  ReviewEquipmentBlock,
  ReviewFeaturesBlock,
  ReviewHeaderBlock,
  ReviewIdentityBlock,
  ReviewMovementBlock,
  ReviewPackInfoBlock,
  ReviewProvenanceBlock,
  ReviewStatCardsBlock,
} from "./reviewValueBlocks";

export const componentRegistry: Record<
  string,
  (props: RegistryComponentProps) => ReactNode
> = {
  "layout.singleColumn": SingleColumnLayout,
  "entityType.singleSelect": EntityTypeSingleSelectBlock,
  "metadata.nameField": MetadataNameFieldBlock,
  "abilities.allocator": AbilityAllocatorBlock,
  "skills.allocator": SkillsAllocatorBlock,
  "review.sheet": ReviewSheetBlock,
  "review.header": ReviewHeaderBlock,
  "review.identity": ReviewIdentityBlock,
  "review.statCards": ReviewStatCardsBlock,
  "review.saveHp": ReviewSaveHpBlock,
  "review.attacks": ReviewTableAttacksBlock,
  "review.features": ReviewFeaturesBlock,
  "review.abilities": ReviewTableAbilitiesBlock,
  "review.combat": ReviewCombatBlock,
  "review.skills": ReviewSkillsBlock,
  "review.equipment": ReviewEquipmentBlock,
  "review.movement": ReviewMovementBlock,
  "review.decisions": ReviewDecisionsBlock,
  "review.packInfo": ReviewPackInfoBlock,
  "review.provenance": ReviewProvenanceBlock,
};
