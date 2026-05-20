import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function MotionSection({
  as: Tag = "section",
  className,
  delay = 0,
  amount = 0.15,
  children,
  ...rest
}) {
  const MotionTag = motion(Tag);
  return (
    <MotionTag
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={variants}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

export function MotionItem({
  as: Tag = "div",
  className,
  delay = 0,
  children,
  ...rest
}) {
  const MotionTag = motion(Tag);
  return (
    <MotionTag
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={variants}
      transition={{ duration: 0.55, ease: "easeOut", delay }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
