import type { ReactNode } from "react";
import type {
  ReviewFeaturesSectionData,
  ReviewHeaderData,
  ReviewIdentitySectionData,
  ReviewPackInfoSectionData,
  ReviewProvenanceSectionData,
  ReviewStatCardsSectionData,
  ReviewTextSectionData,
} from "./pageDataBuilders";
import type { RegistryComponentProps } from "./baseBlocks";

function renderValueRows(rows: ReviewTextSectionData["rows"]) {
  return rows.map((row) => (
    <p key={row.label}>
      {row.label}: {row.value}
    </p>
  ));
}

function ReviewPageSection({
  nodeId,
  children,
}: {
  nodeId: string;
  children: ReactNode;
}) {
  return (
    <section className="review-page" data-node-id={nodeId}>
      {children}
    </section>
  );
}

export function ReviewHeaderBlock({ node, data }: RegistryComponentProps) {
  const review = data as ReviewHeaderData | undefined;
  if (!review) {
    throw new Error(`Missing data for component ${node.componentId} at node ${node.id}`);
  }

  return (
    <ReviewPageSection nodeId={node.id}>
      <h2>{review.title}</h2>
      <header className="review-hero">
        <div>
          <h3 className="review-character-name">{review.characterName}</h3>
          <p className="review-character-meta">
            {review.raceLabel}: <strong>{review.selectedRaceName}</strong> | {review.classLabel}: <strong>{review.selectedClassName}</strong>
          </p>
        </div>
        <div className="review-actions">
          <button onClick={review.onExportJson}>{review.exportLabel}</button>
          <button onClick={review.onToggleProvenance}>{review.provenanceLabel}</button>
        </div>
      </header>
    </ReviewPageSection>
  );
}

export function ReviewIdentityBlock({ node, data }: RegistryComponentProps) {
  const section = data as ReviewIdentitySectionData | undefined;
  if (!section) {
    throw new Error(`Missing data for component ${node.componentId} at node ${node.id}`);
  }
  return <ReviewPageSection nodeId={node.id}><article className="sheet review-decisions"><h3>{section.title}</h3>{renderValueRows(section.rows)}</article></ReviewPageSection>;
}

export function ReviewStatCardsBlock({ node, data }: RegistryComponentProps) {
  const section = data as ReviewStatCardsSectionData | undefined;
  if (!section) {
    throw new Error(`Missing data for component ${node.componentId} at node ${node.id}`);
  }
  return (
    <ReviewPageSection nodeId={node.id}>
      <section className="review-stat-cards">
        {section.cards.map((card) => (
          <article className="review-card" key={card.label}>
            <h3>{card.label}</h3>
            <p>{String(card.value)}</p>
          </article>
        ))}
      </section>
    </ReviewPageSection>
  );
}

export function ReviewFeaturesBlock({ node, data }: RegistryComponentProps) {
  const section = data as ReviewFeaturesSectionData | undefined;
  if (!section) {
    throw new Error(`Missing data for component ${node.componentId} at node ${node.id}`);
  }
  return (
    <ReviewPageSection nodeId={node.id}>
      <article className="sheet">
        <h3>{section.featTitle}</h3>
        {section.featSummary.length === 0 ? <p className="review-muted">{section.emptyLabel}</p> : <ul className="calc-list">{section.featSummary.map((feat) => <li key={feat.id}><strong>{feat.name}</strong>: {feat.description}</li>)}</ul>}
      </article>
      <article className="sheet">
        <h3>{section.traitTitle}</h3>
        {section.traitSummary.length === 0 ? <p className="review-muted">{section.emptyLabel}</p> : <ul className="calc-list">{section.traitSummary.map((trait) => <li key={trait.id}><strong>{trait.name}</strong>: {trait.description}</li>)}</ul>}
      </article>
    </ReviewPageSection>
  );
}

function TextSectionBlock({ node, data }: RegistryComponentProps, section: ReviewTextSectionData | undefined) {
  if (!section) {
    throw new Error(`Missing data for component ${node.componentId} at node ${node.id}`);
  }
  return <ReviewPageSection nodeId={node.id}><article className="sheet review-decisions"><h3>{section.title}</h3>{renderValueRows(section.rows)}</article></ReviewPageSection>;
}

export function ReviewEquipmentBlock(props: RegistryComponentProps) {
  return TextSectionBlock(props, props.data as ReviewTextSectionData | undefined);
}

export function ReviewMovementBlock(props: RegistryComponentProps) {
  return TextSectionBlock(props, props.data as ReviewTextSectionData | undefined);
}

export function ReviewDecisionsBlock(props: RegistryComponentProps) {
  return TextSectionBlock(props, props.data as ReviewTextSectionData | undefined);
}

export function ReviewPackInfoBlock({ node, data }: RegistryComponentProps) {
  const section = data as ReviewPackInfoSectionData | undefined;
  if (!section) {
    throw new Error(`Missing data for component ${node.componentId} at node ${node.id}`);
  }
  return (
    <ReviewPageSection nodeId={node.id}>
      <article className="sheet review-decisions">
        <h3>{section.title}</h3>
        <p>{section.selectedEditionLabel}: {section.selectedEdition}</p>
        <p>{section.enabledPacksLabel}:</p>
        <ul>{section.enabledPacks.map((pack) => <li key={pack.packId}>{pack.packId} ({pack.version})</li>)}</ul>
        <p>{section.fingerprintLabel}: <code>{section.fingerprint}</code></p>
      </article>
    </ReviewPageSection>
  );
}

export function ReviewProvenanceBlock({ node, data }: RegistryComponentProps) {
  const section = data as ReviewProvenanceSectionData | undefined;
  if (!section) {
    return null;
  }
  return <ReviewPageSection nodeId={node.id}><article className="sheet"><h3>{section.title}</h3><pre>{section.json}</pre></article></ReviewPageSection>;
}
