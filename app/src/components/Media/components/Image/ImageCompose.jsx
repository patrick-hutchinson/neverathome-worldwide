import { useState } from "react";

import Image from "./Image";
import styles from "../../Media.module.css";
import Placeholder from "../Placeholder";

const ImageCompose = ({ medium, className, eager = false, objectFit, objectPosition }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`${styles.mediaContainer} ${className}`}>
      <Image
        medium={medium}
        setIsLoaded={setIsLoaded}
        eager={eager}
        objectFit={objectFit}
        objectPosition={objectPosition}
      >
        <Placeholder medium={medium} isLoaded={isLoaded} />
      </Image>
    </div>
  );
};

export default ImageCompose;
