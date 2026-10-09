import { useEffect } from "react";
import nprogress from "nprogress";

/** Shown while a page's code is downloading: the rest of the screen stays, the top progress bar runs. */
export default function PageFallback() {
  useEffect(() => {
    nprogress.start();
    return () => {
      nprogress.done();
    };
  }, []);
  return null;
}
