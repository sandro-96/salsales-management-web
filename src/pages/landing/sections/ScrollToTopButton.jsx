import { useEffect, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ScrollToTopButton({ label }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 480);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible ? (
        <Motion.div
          key="scroll-top"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6"
        >
          <Button
            size="icon"
            onClick={scrollTop}
            aria-label={label}
            className="h-11 w-11 rounded-full shadow-lg shadow-primary/30"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        </Motion.div>
      ) : null}
    </AnimatePresence>
  );
}
