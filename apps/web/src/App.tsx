import { WizardMainView } from "./app-shell/WizardMainView";
import { useAppController } from "./app-shell/useAppController";

export { resolvePageSchemaForStep } from "./pageSchemaResolver";

export function App() {
  const controller = useAppController();
  return <WizardMainView controller={controller} />;
}
