import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    /* config options here */
    output: "export",
    trailingSlash: false,
    distDir: "out",
    assetPrefix: "./",
    basePath: "",
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: "https",
                hostname: "vibemix.itsjo.works",
                port: "",
                pathname: "/**",
            },
        ],
    },
}

export default nextConfig
