import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const etsBin = require.resolve('egg-ts-helper/dist/bin.js');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');

describe('ts-helper integration', () => {
  const fixture = path.join(__dirname, 'fixtures/apps/ts-helper-typegen');
  const typingsDir = path.join(fixture, 'typings');

  beforeEach(() => {
    fs.rmSync(typingsDir, { recursive: true, force: true });
  });

  after(() => {
    fs.rmSync(typingsDir, { recursive: true, force: true });
  });

  it('generates CustomController and CustomMiddleware declarations', () => {
    const extraConfig = JSON.stringify({
      customLoader: {
        eggPaths: [ repoRoot ],
        plugins: {
          teggSocketIO: {
            enable: true,
            path: repoRoot,
          },
        },
      },
    });

    execFileSync(
      process.execPath,
      [ etsBin, '--cwd', fixture, '--silent', '--extra', extraConfig ],
      { stdio: 'inherit' },
    );

    const controllerDts = fs.readFileSync(
      path.join(typingsDir, 'app/io/controller/index.d.ts'),
      'utf8',
    );
    assert.match(controllerDts, /interface CustomController/);
    assert.match(controllerDts, /ping: typeof ExportPing/);

    const middlewareDts = fs.readFileSync(
      path.join(typingsDir, 'app/io/middleware/index.d.ts'),
      'utf8',
    );
    assert.match(middlewareDts, /interface CustomMiddleware/);
    assert.match(middlewareDts, /auth: ReturnType/);
  });
});

