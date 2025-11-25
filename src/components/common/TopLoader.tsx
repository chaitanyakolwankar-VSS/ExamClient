import { useEffect } from "react";
import { useLocation } from "react-router";
import nprogress from "nprogress";
import "nprogress/nprogress.css";

// Customize the bar color in your index.css if needed
nprogress.configure({ showSpinner: false, speed: 600 });

export default function TopLoader() {
  const location = useLocation();

  useEffect(() => {
    nprogress.start();
    // Small timeout to simulate loading or wait for React to render
    const timer = setTimeout(() => {
      nprogress.done();
    }, 300); 

    return () => {
      clearTimeout(timer);
      nprogress.done();
    };
  }, [location.pathname]); // Triggers on every route change

  return null;
}