import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const GeneralSans = localFont({
	src: "../public/fonts/GeneralSans-Variable.woff2",
	display: "swap",
	variable: "--font-sans",
});

// const inter = Inter({
// 	variable: "--font-sans",
// 	subsets: ["latin"],
// });

const jetMono = JetBrains_Mono({
	variable: "--font-jet-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "ParkOS | Next-Gen Parking",
	description: "Smart parking system for urban spaces",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark">
			<body
				className={`${GeneralSans.variable} ${jetMono.variable} antialiased overflow-hidden`}
			>
				{children}
			</body>
		</html>
	);
}
