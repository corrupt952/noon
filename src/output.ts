import { encode as toToon } from "@toon-format/toon";

export function output(data: unknown, json: boolean = false): void {
  if (json) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(toToon(data));
  }
}
