import type { PageSchemaNode } from "@dcb/schema";
import type { ReviewSheetData } from "./pageDataBuilders";
import type { RegistryComponentProps } from "./baseBlocks";
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

function childNode(node: PageSchemaNode, suffix: string): PageSchemaNode {
  return { ...node, id: `${node.id}-${suffix}` };
}

export function ReviewSheetBlock({ node, data }: RegistryComponentProps) {
  const review = data as ReviewSheetData | undefined;
  if (!review) {
    throw new Error(`Missing data for component ${node.componentId} at node ${node.id}`);
  }

  const slots = {};

  return (
    <>
      <ReviewHeaderBlock node={childNode(node, "header")} data={review.header} slots={slots} />
      <ReviewIdentityBlock node={childNode(node, "identity")} data={review.identity} slots={slots} />
      <ReviewStatCardsBlock node={childNode(node, "stat-cards")} data={review.statCards} slots={slots} />
      <ReviewSaveHpBlock node={childNode(node, "save-hp")} data={review.saveHp} slots={slots} />
      <ReviewTableAttacksBlock node={childNode(node, "attacks")} data={review.attacks} slots={slots} />
      <ReviewFeaturesBlock node={childNode(node, "features")} data={review.features} slots={slots} />
      <ReviewTableAbilitiesBlock node={childNode(node, "abilities")} data={review.abilities} slots={slots} />
      <ReviewCombatBlock node={childNode(node, "combat")} data={review.combat} slots={slots} />
      <ReviewSkillsBlock node={childNode(node, "skills")} data={review.skills} slots={slots} />
      <ReviewEquipmentBlock node={childNode(node, "equipment")} data={review.equipment} slots={slots} />
      <ReviewMovementBlock node={childNode(node, "movement")} data={review.movement} slots={slots} />
      <ReviewDecisionsBlock node={childNode(node, "decisions")} data={review.decisions} slots={slots} />
      <ReviewPackInfoBlock node={childNode(node, "pack-info")} data={review.packInfo} slots={slots} />
      {review.provenance && (
        <ReviewProvenanceBlock
          node={childNode(node, "provenance")}
          data={review.provenance}
          slots={slots}
        />
      )}
    </>
  );
}
