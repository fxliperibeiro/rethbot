import { delay } from "./delay";
import { getRandomNumber } from "./getRandomNumber";

export function randomDelay({ min, max }: { min: number; max: number }) {
  return delay(getRandomNumber({ min, max }))
}