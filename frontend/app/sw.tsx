"use client";

import { useEffect } from "react";

declare global {
	interface Window {
		workbox?: any;
	}
}

export function ServiceWorkerRegistration() {
	useEffect(() => {
		if (
			typeof window !== "undefined" &&
			"serviceWorker" in navigator &&
			window.workbox !== undefined
		) {
			const wb = window.workbox;

			// Add event listeners to handle installation and updates
            wb.addEventListener("installed", (event: { type: string; isUpdate: boolean }) => {
                console.log(`Service Worker installed: ${event.type}`);
                if (!event.isUpdate) {
                    console.log("Service Worker installed for the first time");
                }
            });

			wb.addEventListener("controlling", () => {
				console.log("Service Worker controlling this page");
			});

            wb.addEventListener("activated", (event: { type: string; isUpdate: boolean }) => {
                if (!event.isUpdate) {
                    console.log("Service Worker activated for the first time");
                }
            });

			wb.addEventListener("waiting", () => {
				console.log("New Service Worker waiting to be activated");
			});

			wb.addEventListener("redundant", () => {
				console.log("Service Worker became redundant");
			});

			// Register the service worker
			wb.register();
		}
	}, []);

	return null;
}
