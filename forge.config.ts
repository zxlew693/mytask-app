import type { ForgeConfig } from '@electron-forge/shared-types';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: 'MyTask',
    executableName: 'MyTask',
    icon: './public/favicon',
    ignore: [
      /^\/src/,
      /^\/electron\/(?!.*\.js$)/,
      /\.map$/,
      /^\/\.angular/,
      /^\/node_modules\/.bin/,
      /^\/node_modules\/@angular\/cli/,
      /^\/node_modules\/@angular\/compiler-cli/,
      /^\/node_modules\/@electron-forge/,
      /^\/node_modules\/@electron\/rebuild/,
      /^\/node_modules\/typescript/,
      /^\/node_modules\/ts-node/,
      /^\/node_modules\/vitest/,
      /^\/node_modules\/jsdom/,
      /^\/node_modules\/postcss/,
      /^\/node_modules\/tailwindcss/,
      /^\/node_modules\/@tailwindcss/,
      /^\/node_modules\/concurrently/,
      /^\/node_modules\/wait-on/,
      /^\/node_modules\/cross-env/,
      /\.d\.ts$/,
      /\.md$/,
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'MyTask',
        authors: 'Lew Zhi Xuan',
        description: 'A desktop application to record task by project.',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      config: {},
      platforms: ['darwin'],
    },
  ],
  plugins: [
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
