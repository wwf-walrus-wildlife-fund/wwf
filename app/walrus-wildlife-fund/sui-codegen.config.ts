import type { SuiCodegenConfig } from '@mysten/codegen/src/config';

const config: SuiCodegenConfig = {
	output: './src/generated',
	generateSummaries: true,
	prune: true,
	packages: [
		{
			package: '@your-scope/your-package',
			path: '../../contracts/tuskbazaar',
		},
	],
};

export default config;
