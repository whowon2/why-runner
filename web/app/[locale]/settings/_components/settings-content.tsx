"use client";

import { useState } from "react";
import { AppearanceSection } from "./appearance-section";
import { EditorSection } from "./editor-section";
import { NotificationsSection } from "./notifications-section";
import { SettingsNav, type SettingsSection } from "./settings-nav";

export function SettingsContent() {
  const [section, setSection] = useState<SettingsSection>("appearance");

  return (
    <>
      <SettingsNav active={section} onChange={setSection} />

      <div className="flex-1 min-w-0">
        {section === "appearance" && <AppearanceSection />}
        {section === "editor" && <EditorSection />}
        {section === "notifications" && <NotificationsSection />}
      </div>
    </>
  );
}
