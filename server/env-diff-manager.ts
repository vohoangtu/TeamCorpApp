import { envManager, EnvItem } from './env-manager';

export interface EnvDiffRow {
  key: string;
  valueA?: string;
  valueB?: string;
  isSecret: boolean;
  status: 'identical' | 'different' | 'missing_in_b' | 'missing_in_a';
}

export class EnvDiffManager {
  compareEnvs(pathA: string, pathB: string): { rows: EnvDiffRow[]; totalA: number; totalB: number; diffCount: number } {
    const envA = envManager.getEnv(pathA);
    const envB = envManager.getEnv(pathB);

    const mapA = new Map<string, EnvItem>(envA.items.map((i) => [i.key, i]));
    const mapB = new Map<string, EnvItem>(envB.items.map((i) => [i.key, i]));

    const allKeys = Array.from(new Set([...mapA.keys(), ...mapB.keys()])).sort();
    const rows: EnvDiffRow[] = [];
    let diffCount = 0;

    for (const key of allKeys) {
      const itemA = mapA.get(key);
      const itemB = mapB.get(key);

      const isSecret = itemA?.isSecret || itemB?.isSecret || false;

      if (itemA && !itemB) {
        rows.push({ key, valueA: itemA.value, isSecret, status: 'missing_in_b' });
        diffCount++;
      } else if (!itemA && itemB) {
        rows.push({ key, valueB: itemB.value, isSecret, status: 'missing_in_a' });
        diffCount++;
      } else if (itemA && itemB) {
        if (itemA.value === itemB.value) {
          rows.push({ key, valueA: itemA.value, valueB: itemB.value, isSecret, status: 'identical' });
        } else {
          rows.push({ key, valueA: itemA.value, valueB: itemB.value, isSecret, status: 'different' });
          diffCount++;
        }
      }
    }

    return {
      rows,
      totalA: mapA.size,
      totalB: mapB.size,
      diffCount,
    };
  }

  syncKeyToTarget(sourcePath: string, targetPath: string, key: string): { success: boolean; message: string } {
    const sourceEnv = envManager.getEnv(sourcePath);
    const targetEnv = envManager.getEnv(targetPath);

    const sourceItem = sourceEnv.items.find((i) => i.key === key);
    if (!sourceItem) {
      return { success: false, message: `Key ${key} không tồn tại ở nguồn` };
    }

    const newTargetItems = [...targetEnv.items];
    const existingIndex = newTargetItems.findIndex((i) => i.key === key);

    if (existingIndex >= 0) {
      newTargetItems[existingIndex] = { ...newTargetItems[existingIndex], value: sourceItem.value };
    } else {
      newTargetItems.push({ key: sourceItem.key, value: sourceItem.value, isSecret: sourceItem.isSecret });
    }

    return envManager.saveEnv(targetPath, newTargetItems);
  }

  syncGlobalKeyToAll(projectPaths: string[], key: string, value: string): { success: boolean; updatedCount: number } {
    let updatedCount = 0;
    for (const p of projectPaths) {
      const current = envManager.getEnv(p);
      const items = [...current.items];
      const idx = items.findIndex((i) => i.key === key);
      if (idx >= 0) {
        items[idx].value = value;
      } else {
        items.push({ key, value, isSecret: false });
      }
      envManager.saveEnv(p, items);
      updatedCount++;
    }
    return { success: true, updatedCount };
  }
}

export const envDiffManager = new EnvDiffManager();
