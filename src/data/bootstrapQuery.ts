import { lookupApi } from "./lookupApi";
import { lookupKeys } from "./queryKeys";
import { queryClient } from "./queryClient";

/** Bootstrap rarely changes: keep it for the whole session; invalidateBootstrap() refreshes it after edits. */
export const bootstrapQueryOptions = (collegeId: string) => ({
  queryKey: lookupKeys.bootstrap(collegeId),
  queryFn: lookupApi.bootstrap,
  staleTime: Infinity,
});

/** Warm the cache right after login so the first screen opens without a spinner. Never throws. */
export const prefetchBootstrap = (collegeId: string): Promise<void> =>
  queryClient.prefetchQuery(bootstrapQueryOptions(collegeId));

/** Logout / expired session: drop every cached query so nothing leaks to the next user. */
export const clearLookupCache = (): void => {
  queryClient.clear();
};
