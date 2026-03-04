type AnySuiClient = any;

export const canRead = async (
  datasetId: string,
  account: string,
  suiClient: AnySuiClient,
): Promise<boolean> => {
  const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;
  if (!packageId) return false;

  try {
    await suiClient.getDynamicFieldObject({
      parentId: datasetId,
      name: {
        type: `${packageId}::dataset::Reader`,
        value: account,
      },
    });
    return true;
  } catch {
    return false;
  }
};
