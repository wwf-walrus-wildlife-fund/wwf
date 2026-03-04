"use client";

import { SearchForm } from "./search-form";

type FindUserFormProps = {
  initialAddress?: string;
};

export function FindUserForm({ initialAddress = "" }: FindUserFormProps) {
  return <SearchForm type="user" initialValue={initialAddress} />;
}
