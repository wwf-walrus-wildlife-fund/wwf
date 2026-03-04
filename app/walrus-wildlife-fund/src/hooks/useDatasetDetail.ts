import { useCurrentClient } from "@mysten/dapp-kit-react";
import { useEffect, useState } from "react";

type DatasetDetail = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  seller: string;
  imageUrl: string;
  projectUrl: string;
  size: string;
  format: string;
  downloads: number;
  expiresIn: string;
  verified: boolean;
};

function extractFields(obj: any): any | null {
  return obj?.data?.content?.fields ?? obj?.object?.json ?? null;
}

function toUiDataset(id: string, fields: any): DatasetDetail {
  const priceMist = Number(fields?.price_sui ?? 0);
  const priceSui = Number.isFinite(priceMist)
    ? (priceMist / 1_000_000_000).toString()
    : "0";

  return {
    id,
    name: String(fields?.name ?? "Untitled Dataset"),
    description: String(fields?.description ?? ""),
    category: String(fields?.project ?? "Other"),
    price: priceSui,
    seller: String(fields?.funds_receiver ?? ""),
    imageUrl: String(fields?.image_url ?? ""),
    projectUrl: String(fields?.project_url ?? ""),
    size: "N/A",
    format: "Encrypted",
    downloads: 0,
    expiresIn: "N/A",
    verified: false,
  };
}

export function useDatasetDetail(id: string): {
  dataset: DatasetDetail | null;
  isLoading: boolean;
} {
  const client = useCurrentClient();
  const [dataset, setDataset] = useState<DatasetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDataset = async () => {
      setIsLoading(true);
      try {
        const object = await client.getObject({
          objectId: id,
          include: {
            json: true,
            owner: true,
          },
        });

        const fields = extractFields(object);
        if (!fields) {
          setDataset(null);
          return;
        }

        setDataset(toUiDataset(id, fields));
      } catch (error) {
        console.error(error);
        setDataset(null);
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
