import { extractTitle } from "./page";

export interface SlimSelectOption {
  name: string;
  color?: string;
}

export interface SlimProperty {
  name: string;
  type: string;
  options?: SlimSelectOption[];
}

export interface SlimDatabaseSchema {
  id: string;
  title: string;
  properties: SlimProperty[];
}

function slimSelectOptions(options: any[]): SlimSelectOption[] | undefined {
  if (!options || options.length === 0) return undefined;
  return options.map((opt) => ({
    name: opt.name,
    ...(opt.color && { color: opt.color }),
  }));
}

export function slimDatabaseSchema(
  database: any,
  dataSource: any,
): SlimDatabaseSchema {
  const properties: SlimProperty[] = [];

  for (const [name, prop] of Object.entries(dataSource.properties || {})) {
    const p = prop as any;
    const slimProp: SlimProperty = {
      name,
      type: p.type,
    };

    if (
      p.type === "select" ||
      p.type === "multi_select" ||
      p.type === "status"
    ) {
      const opts =
        p.select?.options || p.multi_select?.options || p.status?.options;
      slimProp.options = slimSelectOptions(opts);
    }

    properties.push(slimProp);
  }

  return {
    id: database.id,
    title: extractTitle(database),
    properties,
  };
}
