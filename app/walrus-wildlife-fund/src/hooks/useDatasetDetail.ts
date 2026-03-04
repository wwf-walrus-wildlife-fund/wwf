import { datasets } from "@/lib/mock-data";
import type { Dataset } from "@/lib/types";

export function useDatasetDetail(id: string): {
  dataset: Dataset | undefined;
  isLoading: boolean;
} {
  const dataset = datasets.find((d) => d.id === id);

  return {
    dataset,
    isLoading: false,
  };
}
