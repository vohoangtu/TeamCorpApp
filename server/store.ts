import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { Project } from '../src/types';

const DATA_DIR = path.join(os.homedir(), '.windev-hub');
const DATA_FILE = path.join(DATA_DIR, 'projects.json');

export class ProjectStore {
  private projects: Map<string, Project> = new Map();

  constructor() {
    this.ensureDir();
    this.load();
  }

  private ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const list: Project[] = JSON.parse(raw);
        for (const p of list) {
          // Reset runtime status to stopped on server start
          this.projects.set(p.id, {
            ...p,
            status: 'stopped',
            pid: undefined,
          });
        }
      }
    } catch (err) {
      console.error('Error loading projects database:', err);
    }
  }

  private save() {
    try {
      const list = Array.from(this.projects.values());
      fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving projects database:', err);
    }
  }

  getAll(): Project[] {
    return Array.from(this.projects.values());
  }

  get(id: string): Project | undefined {
    return this.projects.get(id);
  }

  set(project: Project): void {
    this.projects.set(project.id, project);
    this.save();
  }

  delete(id: string): boolean {
    const deleted = this.projects.delete(id);
    if (deleted) this.save();
    return deleted;
  }
}

export const projectStore = new ProjectStore();
