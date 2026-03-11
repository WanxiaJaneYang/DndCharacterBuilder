import type { UIText } from "../uiText";
import {
  buildSkillsAllocatorData,
  type SkillsAllocatorData,
} from "./pageDataBuilders";

type Args = {
  t: UIText;
  title: string;
  budget: SkillsAllocatorData["budget"];
  skills: Parameters<typeof buildSkillsAllocatorData>[0]["skills"];
  skillViewModelById: Parameters<typeof buildSkillsAllocatorData>[0]["skillViewModelById"];
  selectedSkillRanks: Record<string, number>;
  onCommitRanks: (skillId: string, nextValue: number, maxRanks: number) => void;
};

export function buildSkillsAllocatorPageData(
  args: Args,
): SkillsAllocatorData {
  return buildSkillsAllocatorData({
    t: args.t,
    title: args.title,
    budget: args.budget,
    skills: args.skills,
    skillViewModelById: args.skillViewModelById,
    selectedSkillRanks: args.selectedSkillRanks,
    onUpdateRanks: (skillId, nextValue) => {
      const skillView = args.skillViewModelById.get(skillId);
      const maxRanks = skillView?.maxRanks ?? 0;
      args.onCommitRanks(skillId, nextValue, maxRanks);
    },
  });
}
