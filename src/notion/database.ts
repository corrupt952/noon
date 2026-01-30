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

export interface SlimDataSourceReference {
  id: string;
  name: string;
}

export interface SlimDatabase {
  id: string;
  title: string;
  data_sources: SlimDataSourceReference[];
}

export interface SlimDataSourceSchema {
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

function extractProperties(
  props: Record<
    string,
    {
      type: string;
      select?: { options: SelectOption[] };
      multi_select?: { options: SelectOption[] };
      status?: { options: SelectOption[] };
    }
  >,
): SlimProperty[] {
  const properties: SlimProperty[] = [];

  for (const [name, prop] of Object.entries(props)) {
    const slimProp: SlimProperty = {
      name,
      type: prop.type,
    };

    if (prop.type === "select" && prop.select) {
      slimProp.options = slimSelectOptions(prop.select.options);
    } else if (prop.type === "multi_select" && prop.multi_select) {
      slimProp.options = slimSelectOptions(prop.multi_select.options);
    } else if (prop.type === "status" && prop.status) {
      slimProp.options = slimSelectOptions(prop.status.options);
    }

    properties.push(slimProp);
  }

  return properties;
}

export function slimDatabase(database: DatabaseObjectResponse): SlimDatabase {
  return {
    id: database.id,
    title: extractTitle(database),
    data_sources: database.data_sources.map((ds) => ({
      id: ds.id,
      name: ds.name,
    })),
  };
}

export function slimDataSourceSchema(
  dataSource: DataSourceObjectResponse,
): SlimDataSourceSchema {
  return {
    id: dataSource.id,
    title: extractTitle(dataSource),
    properties: extractProperties(
      dataSource.properties as Record<
        string,
        {
          type: string;
          select?: { options: SelectOption[] };
          multi_select?: { options: SelectOption[] };
          status?: { options: SelectOption[] };
        }
      >,
    ),
  };
}
