import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["coverage"] },
  {
    files: ["**/*.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: globals.node },
    rules: { ...js.configs.recommended.rules },
  },
];
