import { CATEGORIES, GENERATOR_TYPES, type Category, type GeneratorType } from "@shared/schema";

export function readPlaygroundSearch(search: string) {
  const params = new URLSearchParams(search);
  const category = CATEGORIES.includes(params.get("category") as Category)
    ? params.get("category") as Category : "image";
  const genType = GENERATOR_TYPES.includes(params.get("genType") as GeneratorType)
    ? params.get("genType") as GeneratorType : "prompt_generator";
  let inputs: Record<string, unknown> = {};
  let error: string | undefined;
  if (params.has("inputs")) {
    try {
      const parsed = JSON.parse(params.get("inputs")!);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Inputs must be an object");
      }
      inputs = Object.fromEntries(Object.entries(parsed).filter(([key]) =>
        !["__proto__", "constructor", "prototype"].includes(key)
      ));
    } catch {
      error = "The saved inputs in this link are invalid. Load the result again from History.";
    }
  } else {
    // Support previously generated re-run links.
    params.forEach((value, key) => {
      if (!["category", "genType", "chain", "__proto__", "constructor", "prototype"].includes(key)) {
        inputs[key] = value;
      }
    });
  }
  const chainContext = params.get("chain") ??
    (typeof inputs._chainContext === "string" ? inputs._chainContext : "");
  delete inputs._chainContext;
  return { category, genType, inputs, chainContext, error };
}

export function createPlaygroundUrl(category: string, genType: string, inputs: unknown) {
  return `/playground?${new URLSearchParams({ category, genType, inputs: JSON.stringify(inputs) })}`;
}
