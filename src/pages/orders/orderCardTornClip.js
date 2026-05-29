/** clipPathUnits="objectBoundingBox" — mép dưới chỉ zigzag (không cạnh ngang phẳng) */
export function buildOrderCardTornClipPath({ teeth = 28, valleyY = 0.94 } = {}) {
  const step = 1 / teeth;
  let d = `M 0 0 H 1 V ${valleyY}`;
  for (let i = teeth - 1; i >= 0; i--) {
    d += ` L ${(i + 0.5) * step} 1 L ${i * step} ${valleyY}`;
  }
  return `${d} L 0 0 Z`;
}

export const ORDER_CARD_TORN_CLIP_PATH = buildOrderCardTornClipPath();
