import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Github, GithubIcon } from "lucide-react"
export const metadata: Metadata = {
    title: "VibeMix",
    description: "Create music compilation videos from your images and songs instantly!",
    icons: {
        icon: [
            { url: "/logo_64x64.png", sizes: "64x64", type: "image/png" },
            { url: "/logo_128x128.png", sizes: "128x128", type: "image/png" },
            { url: "/logo_256x256.png", sizes: "256x256", type: "image/png" },
        ],
        apple: [
            { url: "/logo_128x128.png", sizes: "128x128", type: "image/png" },
            { url: "/logo_256x256.png", sizes: "256x256", type: "image/png" },
        ],
        shortcut: "/logo_64x64.png",
    },
}
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="font-body antialiased">
                {children}
                <Toaster />
                <footer className="w-full bg-gray-100 text-center py-8">
                    <p className="text-sm text-gray-600">
                        &copy; {new Date().getFullYear()} VibeMix. All rights reserved.
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex gap-1 place-content-center items-center">
                        Made with ❤️ by{" "}
                        <a
                            href="https://itsjo.works"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                        >
                            Joshua Sinaga
                        </a>
                        <span>|</span>
                        <a
                            href="https://github.com/jo0707"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-[2px] rounded-full self-center align-middle bg-gray-700 inline-block  text-white hover:text-gray-700"
                            aria-label="GitHub Profile"
                        >
                            <Github className="w-4 h-4" />
                        </a>
                    </p>
                </footer>
            </body>
        </html>
    )
}
