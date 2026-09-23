import { useEffect, useRef } from 'react';
import { useLocalGamePaused } from '../engine/local-pause';

import { PausableTasks } from '../engine/pausable-tasks';

export function usePausableTasks(enabled: boolean) {
  const locallyPaused = useLocalGamePaused();
  enabled = enabled && !locallyPaused;
  const tasks = useRef<PausableTasks>();
  tasks.current ??= new PausableTasks(enabled);
  useEffect(() => { tasks.current!.setEnabled(enabled); }, [enabled]);
  useEffect(() => () => tasks.current!.clear(), []);
  return tasks.current;
}
