import { useMemo } from 'react';
import { seededRandom } from '@/lib/utils';

/**
 * Deterministic decorative QR-style matrix rendered as SVG.
 * Not a scannable QR — it's a stable visual derived from `value`, used to
 * convey "this credential carries a verifiable code". Includes finder patterns.
 */
export default function QRCode({ value = 'mavericks', size = 120, fg = '#05060f', bg = '#ffffff', className = '' }) {
  const grid = 21;
  const cells = useMemo(() => {
    const out = [];
    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < grid; x++) {
        const inFinder =
          (x < 7 && y < 7) || (x >= grid - 7 && y < 7) || (x < 7 && y >= grid - 7);
        if (inFinder) continue;
        if (seededRandom(`${value}-${x}-${y}`) > 0.55) out.push({ x, y });
      }
    }
    return out;
  }, [value]);

  const unit = size / grid;
  const Finder = ({ ox, oy }) => (
    <g>
      <rect x={ox * unit} y={oy * unit} width={unit * 7} height={unit * 7} fill={fg} />
      <rect x={(ox + 1) * unit} y={(oy + 1) * unit} width={unit * 5} height={unit * 5} fill={bg} />
      <rect x={(ox + 2) * unit} y={(oy + 2) * unit} width={unit * 3} height={unit * 3} fill={fg} />
    </g>
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} shapeRendering="crispEdges">
      <rect width={size} height={size} fill={bg} rx={unit} />
      {cells.map((c, i) => (
        <rect key={i} x={c.x * unit} y={c.y * unit} width={unit} height={unit} fill={fg} />
      ))}
      <Finder ox={0} oy={0} />
      <Finder ox={grid - 7} oy={0} />
      <Finder ox={0} oy={grid - 7} />
    </svg>
  );
}
