/**
 * AnimatedCounter — counts up from 0 to the target value
 * Used in the admin dashboard stat cards
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const AnimatedCounter = ({ target, duration = 1200 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || target === 0) return;

    let start = 0;
    const step = Math.ceil(target / (duration / 16)); // ~60fps
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return (
    <motion.span
      ref={ref}
      className="text-4xl font-black tabular-nums"
    >
      {count}
    </motion.span>
  );
};

export default AnimatedCounter;
