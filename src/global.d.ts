declare module "*.css";

/** Webpack `EnvironmentPlugin` injects `TRP_ARCHITECT_NOTES_URL` at build time (Story 4.4). */
declare const process: {
  env: {
    TRP_ARCHITECT_NOTES_URL?: string;
  };
};
