import SelectTheme from "./select-theme";
import { SaveOutputFolderToggle } from "./save-output-folder-toggle";
import { InputGpuId } from "./input-gpu-id";
import { CustomModelsFolderSelect } from "./select-custom-models-folder";
import { LogArea } from "./log-area";
import { SelectImageScale } from "./select-image-scale";
import { SelectImageFormat } from "./select-image-format";
import { DonateButton } from "./donate-button";
import React, { useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { customModelsPathAtom, scaleAtom } from "@/atoms/user-settings-atom";
import { InputCompression } from "./input-compression";
import OverwriteToggle from "./overwrite-toggle";
import { ResetSettingsButton } from "./reset-settings-button";
import { FEATURE_FLAGS } from "@common/feature-flags";
import TurnOffNotificationsToggle from "./turn-off-notifications-toggle";
import { cn } from "@/lib/utils";
import { InputCustomResolution } from "./input-custom-resolution";
import { InputTileSize } from "./input-tile-size";
import LanguageSwitcher from "./language-switcher";
import { translationAtom } from "@/atoms/translations-atom";
import { ImageFormat } from "@/lib/valid-formats";
import AutoUpdateToggle from "./auto-update-toggle";
import TTAModeToggle from "./tta-mode-toggle";
import SystemInfo from "./system-info";
import CopyMetadataToggle from "./copy-metadata-toggle";

interface IProps {
  batchMode: boolean;
  saveImageAs: ImageFormat;
  setSaveImageAs: React.Dispatch<React.SetStateAction<ImageFormat>>;
  compression: number;
  setCompression: React.Dispatch<React.SetStateAction<number>>;
  gpuId: string;
  setGpuId: React.Dispatch<React.SetStateAction<string>>;
  logData: string[];
}

function SettingsTab({
  batchMode,
  compression,
  setCompression,
  gpuId,
  setGpuId,
  saveImageAs,
  setSaveImageAs,
  logData,
}: IProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [customModelsPath, setCustomModelsPath] = useAtom(customModelsPathAtom);
  const [scale, setScale] = useAtom(scaleAtom);
  const [enableScrollbar, setEnableScrollbar] = useState(true);
  const [timeoutId, setTimeoutId] = useState(null);
  const t = useAtomValue(translationAtom);

  const setExportType = (format: ImageFormat) => {
    setSaveImageAs(format);
  };

  const handleCompressionChange = (e) => {
    setCompression(e.target.value);
  };

  const handleGpuIdChange = (e) => {
    setGpuId(e.target.value);
    localStorage.setItem("gpuId", e.target.value);
  };

  const copyOnClickHandler = () => {
    navigator.clipboard.writeText(logData.join("\n"));
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  function disableScrolling() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    setTimeoutId(
      setTimeout(function () {
        setEnableScrollbar(false);
      }, 1000),
    );
  }

  function enableScrolling() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    setEnableScrollbar(true);
  }

  return (
    <div
      className={cn(
        "animate-step-in animate z-50 flex h-screen flex-col gap-7 overflow-y-auto overflow-x-hidden p-5",
        enableScrollbar ? "" : "hide-scrollbar",
      )}
      onScroll={() => {
        if (enableScrollbar) disableScrolling();
      }}
      onWheel={() => {
        enableScrolling();
      }}
    >
      <div className="flex flex-col gap-2 text-sm font-medium uppercase">
        <p>{t("SETTINGS.SUPPORT.TITLE")}</p>
        <a className="btn btn-primary" href="https://docs.upscayl.org/" target="_blank">
          {t("SETTINGS.SUPPORT.DOCS_BUTTON_TITLE")}
        </a>
        {!FEATURE_FLAGS.APP_STORE_BUILD && <DonateButton />}
      </div>
      <LogArea copyOnClickHandler={copyOnClickHandler} isCopied={isCopied} logData={logData} />
      <SelectTheme />
      <LanguageSwitcher />
      <SelectImageFormat batchMode={batchMode} saveImageAs={saveImageAs} setExportType={setExportType} />
      <CopyMetadataToggle saveImageAs={saveImageAs} setExportType={setExportType} />
      <SelectImageScale scale={scale} setScale={setScale} />
      <InputCustomResolution />
      <InputCompression compression={compression} handleCompressionChange={handleCompressionChange} />
      <SaveOutputFolderToggle />
      <OverwriteToggle />
      <TurnOffNotificationsToggle />
      <AutoUpdateToggle />
      <InputGpuId gpuId={gpuId} handleGpuIdChange={handleGpuIdChange} />
      <InputTileSize />
      <CustomModelsFolderSelect customModelsPath={customModelsPath} setCustomModelsPath={setCustomModelsPath} />
      <TTAModeToggle />
      <ResetSettingsButton />
      <SystemInfo />
    </div>
  );
}

export default SettingsTab;
