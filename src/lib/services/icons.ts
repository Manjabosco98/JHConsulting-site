import {
  Bot, Layers3, Network, ChartNoAxesCombined, Database, Sparkles, ServerCog, FileCog,
  Code2, Cpu, Cloud, Workflow, GitBranch, LineChart, BarChart3, Boxes, Zap, ShieldCheck,
  Wrench, Blocks, Braces, Table2, Bug, Rocket, Settings2, Globe, PlugZap, BrainCircuit,
  Layout, MonitorSmartphone, Container, type LucideIcon
} from "lucide-react";

/**
 * Allowlist of icons an admin may pick for a service. Stored as the name string
 * in services.icon; the public section resolves it here. Keep names in sync with
 * the installed lucide-react. Order is the picker order.
 */
export const serviceIcons = {
  Bot, Layers3, Network, ChartNoAxesCombined, Database, Sparkles, ServerCog, FileCog,
  Code2, Cpu, Cloud, Workflow, GitBranch, LineChart, BarChart3, Boxes, Zap, ShieldCheck,
  Wrench, Blocks, Braces, Table2, Bug, Rocket, Settings2, Globe, PlugZap, BrainCircuit,
  Layout, MonitorSmartphone, Container
} satisfies Record<string, LucideIcon>;

export type ServiceIconName = keyof typeof serviceIcons;
export const serviceIconNames = Object.keys(serviceIcons) as ServiceIconName[];
export const DEFAULT_SERVICE_ICON: ServiceIconName = "Sparkles";

export function isServiceIconName(value: string): value is ServiceIconName {
  // Object.hasOwn, not `in`: `in` also matches prototype keys such as
  // "toString" or "constructor", which are not icons.
  return Object.hasOwn(serviceIcons, value);
}

/** Never throws: an unknown stored name falls back to the default icon. */
export function resolveServiceIcon(name: string): LucideIcon {
  return isServiceIconName(name) ? serviceIcons[name] : serviceIcons[DEFAULT_SERVICE_ICON];
}
