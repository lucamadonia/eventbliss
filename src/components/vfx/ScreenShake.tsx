/**
 * ScreenShake — wraps children and shakes them on trigger.
 *
 * Usage:
 *   const shakeRef = useRef<{ shake: () => void }>(null);
 *   <ScreenShake ref={shakeRef}><GameContent /></ScreenShake>
 *   shakeRef.current?.shake();
 */
import { forwardRef, useImperativeHandle, useState, useCallback, ReactNode } from "react";
import { motion } from "framer-motion";

export interface ScreenShakeHandle {
  shake: () => void;
}

interface Props {
  children: ReactNode;
  className?: string;
}

export const ScreenShake = forwardRef<ScreenShakeHandle, Props>(({ children, className }, ref) => {
  const [shaking, setShaking] = useState(false);

  const shake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  }, []);

  useImperativeHandle(ref, () => ({ shake }));

  return (
    <motion.div
      className={className}
      animate={
        shaking
          ? { x: [-10, 10, -8, 8, -4, 4, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
});

ScreenShake.displayName = "ScreenShake";
