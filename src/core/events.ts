import { EventEmitter } from "pixi.js";
import { CONFIG } from "../config/config.js";

/** System-wide event bus — all gameplay systems emit/listen here */
export const gameEvents = new EventEmitter();

/** Event name strings (single source of truth; use with `gameEvents`) */
export const EVENTS = CONFIG.EVENTS;
