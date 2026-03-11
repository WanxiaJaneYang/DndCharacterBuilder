import { useAppController } from "./app-shell/useAppController";
import { WizardMainView } from "./app-shell/WizardMainView";

export function App() {
  const controller = useAppController();
  return <WizardMainView controller={controller} />;
}
