import { encode as toToon } from "@toon-format/toon";

let outputJson = false;

export function setOutputJson(value: boolean): void {
  outputJson = value;
}

export function output(data: unknown): void {
  if (outputJson) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(toToon(data));
  }
}
