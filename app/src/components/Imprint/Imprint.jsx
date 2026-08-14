import { useRouter } from "next/router";

import Text from "@/components/Text/Text";

import styles from "./Imprint.module.scss";

const Imprint = ({ imprint = {}, isStandalone = false, onClose }) => {
  const router = useRouter();

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
      <header className={styles.header} typo="h4">
        <div>Legal Notice, Privacy Policy</div>
        <button className={styles.closeButton} onClick={handleClose} type="button">
          Close
        </button>
      </header>

      <div className={styles.content} typo="h6">
        <Text className={styles.textColumn} text={imprint.imprint} />
        <Text className={styles.textColumn} text={imprint.dataPolicy} />
      </div>
    </main>
  );
};

export default Imprint;
