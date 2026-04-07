/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as api_alerts from "../api/alerts.js";
import type * as api_captures from "../api/captures.js";
import type * as api_capturesMutations from "../api/capturesMutations.js";
import type * as api_changes from "../api/changes.js";
import type * as api_locations from "../api/locations.js";
import type * as api_locationsMutations from "../api/locationsMutations.js";
import type * as api_schedules from "../api/schedules.js";
import type * as api_sessions from "../api/sessions.js";
import type * as api_stats from "../api/stats.js";
import type * as auth from "../auth.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "api/alerts": typeof api_alerts;
  "api/captures": typeof api_captures;
  "api/capturesMutations": typeof api_capturesMutations;
  "api/changes": typeof api_changes;
  "api/locations": typeof api_locations;
  "api/locationsMutations": typeof api_locationsMutations;
  "api/schedules": typeof api_schedules;
  "api/sessions": typeof api_sessions;
  "api/stats": typeof api_stats;
  auth: typeof auth;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
