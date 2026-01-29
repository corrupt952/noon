import type {
  DatabaseObjectResponse,
  DataSourceObjectResponse,
} from "@notionhq/client";
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

interface SelectOption {
  name: string;
  color?: string;
}

function slimSelectOptions(
  options: SelectOption[] | undefined,
): SlimSelectOption[] | undefined {
  if (!options || options.length === 0) return undefined;
  return options.map((opt) => ({
    name: opt.name,
    ...(opt.color && { color: opt.color }),
  }));
}

export function slimDatabaseSchema(
  database: DatabaseObjectResponse,
  dataSource: DataSourceObjectResponse,
): SlimDatabaseSchema {
  const properties: SlimProperty[] = [];

  for (const [name, prop] of Object.entries(dataSource.properties)) {
    const slimProp: SlimProperty = {
      name,
      type: prop.type,
    };

    if (prop.type === "select") {
      slimProp.options = slimSelectOptions(prop.select.options);
    } else if (prop.type === "multi_select") {
      slimProp.options = slimSelectOptions(prop.multi_select.options);
    } else if (prop.type === "status") {
      slimProp.options = slimSelectOptions(prop.status.options);
    }

    properties.push(slimProp);
  }

  return {
    id: database.id,
    title: extractTitle(database),
    properties,
  };
}
