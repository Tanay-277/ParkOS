import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ErrorBoundary } from "@/components/error-boundary";
import { ServiceWorkerRegistration } from "@/components/sw-registration";

const GeneralSans = localFont({
	src: "../public/fonts/GeneralSans-Variable.woff2",
	display: "swap",
	variable: "--font-sans",
});

const inter = Inter({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-sans",
});

const jetMono = JetBrains_Mono({
	variable: "--font-jet-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "ParkOS - Smart Parking System",
	description: "A modern parking management system that optimizes parking allocation using OS concepts",
	applicationName: "ParkOS",
	appleWebApp: {
		capable: true,
		title: "ParkOS",
		statusBarStyle: "black-translucent",
	},
	manifest: "/manifest.json",
	robots: "index, follow",
	openGraph: {
		type: "website",
		siteName: "ParkOS",
		title: "ParkOS - Smart Parking System",
		description: "A modern parking management system that optimizes parking allocation using OS concepts"
	}
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	themeColor: [
		{ media: "(prefers-color-scheme: dark)", color: "#121212" },
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" }
	]
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="apple-touch-icon" href="/icons/apple-icon-180.png" />
				<link rel="icon" href="/favicon.ico" sizes="any" />
			</head>
			<body className={`${GeneralSans.variable} ${jetMono.variable} ${inter.className} dark`}>
				<ErrorBoundary>
					{children}
				</ErrorBoundary>
				<ServiceWorkerRegistration />
			</body>
		</html>
	);
}
