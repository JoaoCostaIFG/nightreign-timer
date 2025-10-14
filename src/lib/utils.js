import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const assetUrl = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;