import type { ForgeConfig } from '@electron-forge/shared-types';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: 'TodoApp',
    executableName: 'todo-app',
    ignore: [
      /^\/src/,
      /^\/electron\/(?!.*\.js$)/,
      /\.map$/,
      /^\/\.angular/,
      /^\/node_modules\/.bin/,
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'TodoApp',
        authors: 'StazLab',
        description: 'A desktop todo application to record task by project.',
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
