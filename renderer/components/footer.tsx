import { translationAtom } from "@/atoms/translations-atom";
import { useAtomValue } from "jotai";
import React from "react";

function Footer() {
  const t = useAtomValue(translationAtom);

  return (
    <div className="p-2 text-center text-xs text-base-content/50">
      <p>
        {t("FOOTER.COPYRIGHT")} {new Date().getFullYear()} -{" "}
        <a
          className="font-bold"
          href="https://github.com/upscayl/upscayl"
          target="_blank"
        >
          {t("TITLE")}
        </a>
      </p>
      <p>
        {t("FOOTER.TITLE")}
        <a
          href="https://github.com/upscayl"
          className="font-bold"
          target="_blank"
        >
          {t("FOOTER.LINK_TITLE")}
        </a>
      </p>
    </div>
  );
}

export default Footer;
