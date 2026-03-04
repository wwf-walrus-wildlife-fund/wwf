"use client";

import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

type FindDatasetFormProps = {
  initialDatasetId?: string;
};

export function FindDatasetForm({ initialDatasetId = "" }: FindDatasetFormProps) {
  const router = useRouter();
  const [datasetId, setDatasetId] = useState(initialDatasetId);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = datasetId.trim();
    if (!trimmed) return;
    router.push(`/datasets/${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <p className="text-white/30 mb-2" style={{ fontSize: "0.8rem" }}>
        Find dataset by object id
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            placeholder="0x..."
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-[#6C5CE7]/30 focus:bg-white/[0.05] transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-3 rounded-xl bg-[#4834D4]/15 text-[#C4B5FD] border border-[#4834D4]/25 hover:bg-[#4834D4]/25 transition-all"
        >
          Find dataset
        </button>
      </div>
    </form>
  );
}
