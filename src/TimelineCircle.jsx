import React from "react";

// Props: phases (array), phaseIndex (number), phaseTime (number), phaseTotal (number)
export default function TimelineCircle({ phases, phaseIndex, phaseTime, phaseTotal }) {
  // Calculate hand angle: 0° at phase 0, 90° at phase 1, etc.
  // Interpolate within phase
  const totalPhases = phases.length;
  const baseAngle = (360 / totalPhases) * phaseIndex;
  const phaseProgress = phaseTotal > 0 ? 1 - phaseTime / phaseTotal : 1;
  const handAngle = baseAngle + (360 / totalPhases) * phaseProgress;

  // Quadrant colors: Noontide (top right, bottom left) - sunny; Night (top left, bottom right) - deep purple
  const colors = [
    "#FFD700", // Noontide - top right (gold/sunny)
    "#581C87", // Night - top left (deep purple)
    "#FFD700", // Noontide - bottom left (gold/sunny)
    "#581C87", // Night - bottom right (deep purple)
  ];

  // Quadrant labels in order: top right, top left, bottom left, bottom right
  const labels = [
    "Noontide", // top right
    "Night",    // top left
    "Noontide", // bottom left
    "Night",    // bottom right
  ];

  // Font sizes for labels: smaller for Noontide to avoid overflow
  const labelFontSizes = [13, 16, 13, 16];
  // Label radii: slightly smaller for Noontide
  const labelRs = [62, 70, 62, 70];

  return (
    <svg width={220} height={220} viewBox="0 0 220 220">
      <g transform="translate(110,110)">
        {/* Decorative border */}
        <circle
          cx={0}
          cy={0}
          r={104}
          fill="none"
          stroke="#000000"
          strokeWidth={4}
          style={{ filter: "drop-shadow(0 0 8px #FFD70088)" }}
        />
        {/* Draw quadrants */}
        {phases.map((p, i) => {
          const startAngle = (i * 360) / totalPhases - 90;
          const endAngle = ((i + 1) * 360) / totalPhases - 90;
          const largeArc = endAngle - startAngle > 180 ? 1 : 0;
          const r = 100;
          const x1 = r * Math.cos((startAngle * Math.PI) / 180);
          const y1 = r * Math.sin((startAngle * Math.PI) / 180);
          const x2 = r * Math.cos((endAngle * Math.PI) / 180);
          const y2 = r * Math.sin((endAngle * Math.PI) / 180);
          return (
            <path
              key={i}
              d={`M0,0 L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`}
              fill={colors[i % colors.length]}
              opacity={0.85}
            />
          );
        })}
        {/* Draw hand */}
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={-90}
          stroke="#000000"
          strokeWidth={6}
          strokeLinecap="round"
          transform={`rotate(${handAngle})`}
          style={{ filter: "drop-shadow(0 0 6px #FFD70088)" }}
        />
        {/* Center circle */}
        <circle cx={0} cy={0} r={16} fill="#151136" stroke="#FFD700" strokeWidth={3} />
        {/* Phase labels */}
        {phases.map((p, i) => {
          // Place labels at the center of each quadrant arc
          const angle = ((i + 0.5) * 360) / totalPhases - 90;
          const labelR = labelRs[i % labelRs.length];
          const x = labelR * Math.cos((angle * Math.PI) / 180);
          const y = labelR * Math.sin((angle * Math.PI) / 180) + 5;
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              fontSize={labelFontSizes[i % labelFontSizes.length]}
              fill={colors[i % colors.length] === "#FFD700" ? "#000000" : "#FFD700"}
              style={{
                fontFamily: "serif",
                fontWeight: "bold",
                textShadow: "0 1px 4px #000",
                letterSpacing: "1px",
                pointerEvents: "none",
                whiteSpace: "pre",
              }}
            >
              {labels[i]}
            </text>
          );
        })}
      </g>
    </svg>
  );
}
