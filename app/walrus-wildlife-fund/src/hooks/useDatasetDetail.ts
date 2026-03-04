import { useCurrentClient } from "@mysten/dapp-kit-react";
import { useEffect, useState } from "react";

export function useDatasetDetail(id: string): {
  dataset: any;
  isLoading: boolean;
} {
  const client = useCurrentClient();
  const [dataset, setDataset] = useState<any | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDataset = async () => {
      setIsLoading(true);
      try {
        const dataset = await client.getObject({
          objectId: id,
          include: {
            json: true
          }
        });
        setDataset(dataset);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDataset();
  }, [client, id]);

  return {
    dataset,
    isLoading,
  };
}
