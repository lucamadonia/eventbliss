export interface Stroke {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color?: string;
  size?: number;
  tool?: 'pen' | 'eraser';
}

export function isStroke(value: unknown): value is Stroke {
  if (!value || typeof value !== 'object') return false;
  const stroke = value as Record<string, unknown>;
  return ['from', 'to'].every(key => {
    const point = stroke[key] as Record<string, unknown> | undefined;
    return !!point && typeof point.x === 'number' && Number.isFinite(point.x) && typeof point.y === 'number' && Number.isFinite(point.y);
  }) && (stroke.size === undefined || (typeof stroke.size === 'number' && Number.isFinite(stroke.size) && stroke.size > 0 && stroke.size <= 100))
    && (stroke.color === undefined || typeof stroke.color === 'string')
    && (stroke.tool === undefined || stroke.tool === 'pen' || stroke.tool === 'eraser');
}
