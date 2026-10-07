import type { Material, PartInfo } from "@vitra/schemas";
export type Data = { product: { id: string; name: string; brand: string; basePrice: number }; materials: Material[]; parts: PartInfo[] };
export const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export async function loadData(): Promise<Data> {
  const g = async <T,>(n: string) => (await fetch(`${base}/data/${n}.json`)).json() as Promise<T>;
  const [product, materials, parts] = await Promise.all([g<Data["product"]>("product"), g<Material[]>("materials"), g<PartInfo[]>("parts")]);
  return { product, materials, parts };
}
