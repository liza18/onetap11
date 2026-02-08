import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface SettingsSectionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}

const SettingsSection = ({ icon: Icon, title, description, children }: SettingsSectionProps) => (
  <div className="glass-card rounded-2xl overflow-hidden">
    <div className="px-5 pt-5 pb-3">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
      </div>
      <p className="text-xs text-muted-foreground ml-11">{description}</p>
    </div>
    <div className="px-1 pb-4">
      {children}
    </div>
  </div>
);

export default SettingsSection;
