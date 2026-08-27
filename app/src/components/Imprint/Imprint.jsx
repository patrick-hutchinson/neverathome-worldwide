import { useRouter } from "next/router";

import Text from "@/components/Text/Text";

import styles from "./Imprint.module.scss";
import { useContext } from "react";
import { DeviceContext } from "@/context/DeviceContext";

const getDownloadUrl = (file) => {
  const url = file?.asset?.url;
  if (!url) return null;

  const filename = file.asset.originalFilename;
  if (!filename) return url;

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}dl=${encodeURIComponent(filename)}`;
};

const Imprint = ({ imprint = {}, isStandalone = false, onClose }) => {
  const router = useRouter();
  const privacyPolicyDownloadUrl = getDownloadUrl(imprint.privacyPolicyFile);

  const { isMobile } = useContext(DeviceContext);

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <main className={[styles.imprint, isStandalone ? styles.standalone : ""].filter(Boolean).join(" ")}>
      <header className={styles.header} typo={isMobile ? "h3 compensate" : "h4 compensate"}>
        <div>Legal Notice, Privacy Policy</div>
        <button className={styles.closeButton} onClick={handleClose} type="button">
          Close
        </button>
      </header>

      <div className={styles.content} typo="h6">
        <Text className={styles.textColumn} text={imprint.imprint} />
        <div className={styles.textColumn}>
          <Text text={imprint.dataPolicy} />
          {privacyPolicyDownloadUrl ? (
            <a
              className={styles.downloadLink}
              download={imprint.privacyPolicyFile?.asset?.originalFilename || true}
              href={privacyPolicyDownloadUrl}
            >
              NAH Privacy Policy (download)
            </a>
          ) : null}
        </div>
      </div>
    </main>
  );
};

export default Imprint;
