import type { Dataset } from "@/types/domain";
import { createDataset, DATA_SEED } from "@/lib/data/generator";
import { moscowDayIndex } from "@/lib/dates";

interface DatasetCache {
  day: number;
  dataset: Dataset;
}

let cache: DatasetCache | null = null;

export function getDataset(now: Date = new Date()): Dataset {
  const day = moscowDayIndex(now);
  if (!cache || cache.day !== day) {
    cache = { day, dataset: createDataset(now, DATA_SEED) };
  }
  return cache.dataset;
}

export function resetDatasetCache(): void {
  cache = null;
}
