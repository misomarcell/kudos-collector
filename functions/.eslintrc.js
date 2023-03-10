module.exports = {
	root: true,
	env: {
		es6: true,
		node: true
	},
	extends: [
		"eslint:recommended",
		"plugin:import/errors",
		"plugin:import/warnings",
		"plugin:import/typescript",
		"google",
		"plugin:@typescript-eslint/recommended"
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: ["tsconfig.json", "tsconfig.dev.json"],
		sourceType: "module"
	},
	ignorePatterns: [
		"/lib/**/*" // Ignore built files.
	],
	plugins: ["@typescript-eslint", "import"],
	rules: {
		"quotes": ["error", "double"],
		"indent": ["error", "tab"],
		"object-curly-spacing": ["error", "always"],
		"max-len": ["error", 120],
		"comma-dangle": ["error", "never"],
		"@typescript-eslint/no-empty-function": ["error", { allow: ["arrowFunctions"] }],
		"@typescript-eslint/no-explicit-any": 0,
		"require-jsdoc": 0,
		"import/no-unresolved": 0,
		"no-tabs": 0
	}
};
