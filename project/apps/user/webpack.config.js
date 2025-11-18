const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/user'),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ["./src/assets"],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
    }),
    {
      apply(compiler) {
        compiler.options.externals = ({ request }, callback) => {
          if (request && request.startsWith('@project/')) {
            return callback();
          }
          if (request && /^[a-z@][a-z0-9.\/\-_@]*$/i.test(request)) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        };
      },
    },
  ],
};
