import fs from 'node:fs';
import path from 'node:path';
import type { RuntimeType } from '../src/types';

export interface DetectionResult {
  runtimeType: RuntimeType;
  runCommand: string;
  buildCommand?: string;
  port?: number;
}

export function detectProject(folderPath: string): DetectionResult {
  if (!fs.existsSync(folderPath)) {
    return {
      runtimeType: 'native',
      runCommand: 'npm run dev',
    };
  }

  // 1. Check Docker Compose
  if (
    fs.existsSync(path.join(folderPath, 'docker-compose.yml')) ||
    fs.existsSync(path.join(folderPath, 'docker-compose.yaml')) ||
    fs.existsSync(path.join(folderPath, 'compose.yaml'))
  ) {
    return {
      runtimeType: 'docker',
      runCommand: 'docker compose up',
      buildCommand: 'docker compose build',
      port: 8080,
    };
  }

  // 2. Check Node.js / Web
  const packageJsonPath = path.join(folderPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const scripts = pkg.scripts || {};
      let runCmd = 'npm start';
      if (scripts.dev) runCmd = 'npm run dev';
      else if (scripts.start) runCmd = 'npm start';
      else if (scripts.serve) runCmd = 'npm run serve';

      const buildCmd = scripts.build ? 'npm run build' : undefined;

      return {
        runtimeType: 'native',
        runCommand: runCmd,
        buildCommand: buildCmd,
        port: 3000,
      };
    } catch {
      // ignore
    }
  }

  // 3. Check Python
  if (
    fs.existsSync(path.join(folderPath, 'requirements.txt')) ||
    fs.existsSync(path.join(folderPath, 'pyproject.toml')) ||
    fs.existsSync(path.join(folderPath, 'main.py')) ||
    fs.existsSync(path.join(folderPath, 'app.py'))
  ) {
    const hasFastApi = fs.existsSync(path.join(folderPath, 'main.py'));
    return {
      runtimeType: 'native',
      runCommand: hasFastApi ? 'uvicorn main:app --reload' : 'python app.py',
      buildCommand: fs.existsSync(path.join(folderPath, 'requirements.txt'))
        ? 'pip install -r requirements.txt'
        : undefined,
      port: 8000,
    };
  }

  // 4. Check Rust
  if (fs.existsSync(path.join(folderPath, 'Cargo.toml'))) {
    return {
      runtimeType: 'native',
      runCommand: 'cargo run',
      buildCommand: 'cargo build',
      port: 8080,
    };
  }

  // 5. Check Go
  if (fs.existsSync(path.join(folderPath, 'go.mod'))) {
    return {
      runtimeType: 'native',
      runCommand: 'go run .',
      buildCommand: 'go build -v .',
      port: 8080,
    };
  }

  return {
    runtimeType: 'native',
    runCommand: 'npm run dev',
    port: 3000,
  };
}
