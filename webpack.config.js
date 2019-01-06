const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const path_dist = "/public/dist";

module.exports = {
    mode: "development",
    devtool: "inline-source-map",
    entry: "./public/src/index.js",
    output: {
        path: __dirname + path_dist,
        filename: "bundle.js"
    },
    module: {
        rules: [
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: ["file-loader"]
            },
            {
                test: /\.js[x]?$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                ]
            }]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./public/src/index.html"
        }),
        new MiniCssExtractPlugin({
            filename: "style.css",
        })
    ]
}