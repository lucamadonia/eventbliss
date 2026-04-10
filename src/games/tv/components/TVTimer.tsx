import { motion } from 'framer-motion';

interface TVTimerProps {
  timeLeft: number;
  totalTime: number;
  size?: number;
}

function getTimerColor(ratio: number): string {
  if (ratio <= 0.25) return '#EF4444';
  if (ratio <= 0.5) return '#FBBF24';
  return '#10B981';
}

export default function TVTimer({ timeLeft, totalTime, size = 160 }: TVTimerProps) {
  const ratio = totalTime > 0 ? timeLeft / totalTime : 0;
  const color = getTimerColor(ratio);
  const isUrgent = timeLeft <= 3 && timeLeft > 0;

  const radius = 60;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const strokeDashoffset = circumference * (1 - ratio);

  // Center of the SVG
  const center = radius;
  const svgSize = radius * 2;

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      animate={
        isUrgent
          ? {
              scale: [1, 1.15, 1],
            }
          : { scale: 1 }
      }
      transition={
        isUrgent
          ? {
              duration: Math.max(0.3, timeLeft * 0.25),
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : undefined
      }
    >
      {/* Glow behind */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
        }}
      />

      {/* SVG ring */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="absolute inset-0"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={normalizedRadius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        {/* Progress ring */}
        <motion.circle
          cx={center}
          cy={center}
          r={normalizedRadius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            filter: `drop-shadow(0 0 8px ${color}88)`,
            transition: 'stroke 0.3s ease, stroke-dashoffset 0.3s linear',
          }}
        />
      </svg>

      {/* Center number */}
      <span
        className="text-5xl font-black tabular-nums relative z-10"
        style={{
          color,
          textShadow: `0 0 20px ${color}66`,
        }}
      >
        {Math.ceil(timeLeft)}
      </span>
    </motion.div>
  );
}
