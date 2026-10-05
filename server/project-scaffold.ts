import fs from 'node:fs';
import path from 'node:path';
import { projectStore } from './store';
import type { Project } from '../src/types';

export interface ScaffoldOptions {
  name: string;
  template: 'vite-react-ts' | 'express-ts' | 'fastify-ts' | 'nextjs-app';
  port: number;
  useTailwind?: boolean;
  targetDir?: string;
}

export class ProjectScaffoldService {
  async scaffoldProject(options: ScaffoldOptions): Promise<{ success: boolean; project: Project; message: string }> {
    const slug = options.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const baseDir = options.targetDir || path.resolve(process.cwd(), '..');
    const destDir = path.join(baseDir, slug);

    if (fs.existsSync(destDir)) {
      return {
        success: false,
        project: null as any,
        message: `Thư mục "${slug}" đã tồn tại tại ${destDir}. Vui lòng chọn tên khác!`,
      };
    }

    fs.mkdirSync(destDir, { recursive: true });
    const srcDir = path.join(destDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });

    let runCommand = 'npm run dev';

    if (options.template === 'vite-react-ts') {
      runCommand = 'npm run dev';

      // package.json
      const pkg = {
        name: slug,
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: `vite --port ${options.port}`,
          build: 'tsc -b && vite build',
          lint: 'eslint .',
          preview: `vite preview --port ${options.port}`,
        },
        dependencies: {
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          'lucide-react': '^1.16.0',
        },
        devDependencies: {
          '@types/react': '^19.0.0',
          '@types/react-dom': '^19.0.0',
          '@vitejs/plugin-react': '^5.0.0',
          typescript: '^5.7.0',
          vite: '^6.2.0',
          tailwindcss: '^4.0.0',
        },
      };
      fs.writeFileSync(path.join(destDir, 'package.json'), JSON.stringify(pkg, null, 2));

      // index.html
      fs.writeFileSync(
        path.join(destDir, 'index.html'),
        `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${options.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
      );

      // src/main.tsx
      fs.writeFileSync(
        path.join(srcDir, 'main.tsx'),
        `import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>🚀 ${options.name}</h1>
      <p>Ứng dụng khởi tạo tự động bởi <strong>WinDev Hub</strong> trên cổng :${options.port}.</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
`
      );

      // vite.config.ts
      fs.writeFileSync(
        path.join(destDir, 'vite.config.ts'),
        `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: ${options.port} }
});`
      );
    } else {
      // Express / Node API template
      runCommand = 'node src/index.js';
      const pkg = {
        name: slug,
        version: '1.0.0',
        main: 'src/index.js',
        scripts: {
          dev: `node --watch src/index.js`,
          start: `node src/index.js`,
        },
        dependencies: {
          express: '^4.21.0',
          cors: '^2.8.5',
          dotenv: '^16.4.5',
        },
      };
      fs.writeFileSync(path.join(destDir, 'package.json'), JSON.stringify(pkg, null, 2));

      fs.writeFileSync(
        path.join(srcDir, 'index.js'),
        `const express = require('express');
const app = express();
const PORT = process.env.PORT || ${options.port};

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello from ${options.name} API!', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log('🚀 [${options.name}] Server running on http://localhost:' + PORT);
});
`
      );
    }

    // Common .env file
    fs.writeFileSync(
      path.join(destDir, '.env'),
      `# Application Config
PORT=${options.port}
APP_NAME="${options.name}"
APP_ENV=development
`
    );

    // Common .gitignore
    fs.writeFileSync(
      path.join(destDir, '.gitignore'),
      `node_modules/
dist/
.env.local
.DS_Store
*.log
`
    );

    // Register into WinDev Hub database
    const createdProject = projectStore.create({
      name: options.name,
      sourceType: 'local',
      sourcePath: destDir,
      runtimeType: 'native',
      runCommand,
      port: options.port,
      autoSync: true,
    });

    return {
      success: true,
      project: createdProject,
      message: `Đã khởi tạo thành công dự án "${options.name}" tại ${destDir}!`,
    };
  }
}

export const projectScaffold = new ProjectScaffoldService();
