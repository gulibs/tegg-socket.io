import path from 'node:path';
import type { Application } from 'egg';

export interface IoLoadDirs {
  controllerDirs: string[];
  middlewareDirs: string[];
}

/**
 * Build controller and middleware directories for every load unit.
 * This helper is shared by the runtime loader and by tooling hooks so they stay in sync.
 */
export function collectIoLoadDirs(loadUnits: Array<{ path: string }>): IoLoadDirs {
  const controllerDirs = loadUnits.map(unit => path.join(unit.path, 'app', 'io', 'controller'));
  const middlewareDirs = loadUnits.map(unit => path.join(unit.path, 'app', 'io', 'middleware'));
  return {
    controllerDirs,
    middlewareDirs,
  };
}

export function getIoLoadDirs(app: Pick<Application, 'loader'>): IoLoadDirs {
  const loadUnits = app.loader.getLoadUnits();
  return collectIoLoadDirs(loadUnits);
}

