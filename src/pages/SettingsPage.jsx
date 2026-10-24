import { Page, SpecLabel } from '../components/Shell.jsx';
import DisplaySettings from '../components/DisplaySettings.jsx';

export default function SettingsPage() {
  return (
    <Page>
      <SpecLabel>F2 / Display settings</SpecLabel>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Make text work for you</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">Every change applies straight away and is remembered on this device.</p>
      <div className="mt-10">
        <DisplaySettings />
      </div>
    </Page>
  );
}
