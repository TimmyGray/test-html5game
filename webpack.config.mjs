import path from "path";
import webpack from "webpack";

import CopyPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import HtmlInlineScriptPlugin from "html-inline-script-webpack-plugin";

export default (_env, argv) => {
  const isDevelopment = argv.mode === "development";
  return {
    stats: "minimal", // Keep console output easy to read.
    entry: "./src/main.ts", // Your program entry point

    // Your build destination
    output: {
      path: path.resolve(process.cwd(), "dist"),
      filename: "bundle.js",
      clean: true,
    },

    // Config for your testing server
    devServer: {
      compress: true,
      allowedHosts: "all", // If you are using WebpackDevServer as your production server, please fix this line!
      static: false,
      client: {
        logging: "warn",
        overlay: {
          errors: true,
          warnings: false,
        },
        progress: true,
      },
      port: 5143,
      host: "0.0.0.0",
    },

    // Web games are bigger than pages, disable the warnings that our game is too big.
    performance: { hints: false },

    // Enable sourcemaps while debugging
    devtool: isDevelopment ? "source-map" : undefined,

    // Minify the code when making a final build
    optimization: {
      minimize: argv.mode === "production",
      splitChunks: false,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            ecma: 6,
            compress: { drop_console: true },
            output: { comments: false, beautify: false },
          },
        }),
      ],
    },

    // Explain webpack how to do Typescript
    module: {
      rules: [
        {
          test: /\.ts(x)?$/,
          loader: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif|mp3|wav|ogg)$/i,
          type: 'asset/inline',
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      extensionAlias: {
        ".js": [".ts", ".js"],
      },
    },

    plugins: [
      // Copy our static assets to the final build
      new CopyPlugin({
        patterns: [{ from: "public/" }],
      }),

      // Make an index.html from the template
      new HtmlWebpackPlugin({
        template: "./index.ejs",
        hash: false,
        minify: true,
      }),

      // Prevent code splitting
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
      ...(!isDevelopment ? [new HtmlInlineScriptPlugin()] : []),
    ],
  };
};
