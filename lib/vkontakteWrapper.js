class VkontakteWrapper {

	constructor(readyCallback) {
		this.sdk = null;
		// Advertisement fields.
		this.bannerVisible = false;
		this.interstitialVisible = false;
		this.rewardedVisible = false;
		// Payments fields.
		this.cacheProductsData = "";
		this.cachePaymentsData = "";
		// Prefs fields.
		this.jsonContainers = runtimeData.prefsContainerTags;
		this.cacheContainers = {};
		// User fields.
		this.userInfo = null;
		// Wrapper initialization.
		console.log("Wrapper initialization started.");
		try {
			let script = document.createElement("script");
			script.src = "https://unpkg.com/@vkontakte/vk-bridge/dist/browser.min.js";
			script.onload = () => {
				this.sdk = vkBridge;
				this.sdk.send('VKWebAppInit').then((data) => {
					console.log("SDK initialized successfully.", data);
					this.resolveSaves().then(() => {
						readyCallback();
					});
				}).catch((exception) => {
					console.error("SDK failed to initialize.", exception);
					readyCallback();
				});
				this.sdk.subscribe((event) => {
					console.log('VK Bridge event', event);
				});
				// Send initial request to check ads availability.
				this.sdk.send("VKWebAppCheckNativeAds", { ad_format: "interstitial" });
				this.sdk.send("VKWebAppCheckNativeAds", { ad_format: "reward" });
				// Resolve user language.
				this.sdk.send("VKWebAppGetUserInfo").then(data => {
					console.log("User info fetched successfully.", data);
					this.userInfo = data;
				}).catch(error => {
					console.error("Error fetching user info.", error);
				});
			};
			document.body.appendChild(script);
		}
		catch (exception) {
			// Initiate application loading anyway.
			console.error("Wrapper initialization failed.", exception);
			readyCallback();
		}
	}

	// Banner advertisement methods.

	isBannerVisible() {
		return this.bannerVisible;
	}

	invokeBanner() {
		console.log("Invoke banner called.");
		this.sdk.send('VKWebAppShowBannerAd', {
			banner_location: 'bottom'
		}).then((data) => {
			if (data.result) {
				console.log("Banner is shown successfully.");
				this.isBannerVisible = true;
			}
		}).catch((error) => {
			console.log("Banner failed to show.", error);
			this.isBannerVisible = false;
		});
	}

	disableBanner() {
		console.log("Disable banner called.");
		this.sdk.send('VKWebAppHideBannerAd').then((data) => {
			if (data.result) {
				console.log("Banner is disabled successfully.");
				this.isBannerVisible = false;
			}
		}).catch((error) => {
			console.log("Failed to disable banner.", error);
		});
	}

	refreshBannerStatus() {
		console.log("Refresh banner status called.");
		this.sdk.send('VKWebAppCheckBannerAd').then((data) => {
			if (data.result) {
				console.log("Banner is visible.");
				this.isBannerVisible = true;
			}
			else {
				console.log("Banner is hidden.");
				this.isBannerVisible = false;
			}
		}).catch((error) => {
			console.log("Failed to resolve banner status.", error);
			this.isBannerVisible = false;
		});
	}

	// Interstitial advertisement methods.

	isInterstitialVisible() {
		return this.interstitialVisible;
	}

	invokeInterstitial() {
		console.log("Invoke interstitial called.");
		return new Promise((resolve, reject) => {
			// Mark interstitial as visible.
			console.log("Interstitial event: onOpen.");
			this.interstitialVisible = true;
			application.publishEvent("OnInterstitialEvent", "Begin");
			// Invoke VK interstitial.
			this.sdk.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' }).then((data) => {
				if (data.result) {
					console.log("Interstitial event: onClose.");
					this.interstitialVisible = false;
					application.publishEvent("OnInterstitialEvent", "Close");
					resolve(data);
				} else {
					console.error("Interstitial event: onError.");
					this.interstitialVisible = false;
					application.publishEvent("OnInterstitialEvent", "Error");
					reject(new Error("Interstitial ad failed to show."));
				}
				// Send request to check interstitial availability again.
				this.sdk.send('VKWebAppCheckNativeAds', { ad_format: 'interstitial' });
			}).catch((exception) => {
				console.error("Invoke interstitial failed.", exception);
				this.interstitialVisible = false;
				application.publishEvent("OnInterstitialEvent", "Error");
				reject(exception);
				// Send request to check interstitial availability again.
				this.sdk.send('VKWebAppCheckNativeAds', { ad_format: 'interstitial' });
			});
		});
	}

	// Rewarded advertisement methods.

	isRewardedVisible() {
		return this.rewardedVisible;
	}

	invokeRewarded() {
		console.log("Invoke rewarded called.");
		return new Promise((resolve, reject) => {
			// Mark rewarded as visible.
			console.log("Rewarded event: onOpen.");
			this.rewardedVisible = true;
			application.publishEvent("OnRewardedEvent", "Begin");
			// Invoke VK rewarded.
			this.sdk.send('VKWebAppShowNativeAds', { ad_format: 'reward' }).then((data) => {
				if (data.result) {
					console.log("Rewarded watched successfully.");
					this.rewardedVisible = false;
					application.publishEvent("OnRewardedEvent", "Close");
					application.publishEvent("OnRewardedEvent", "Success");
					resolve(data);
				}
				else {
					console.error("Rewarded event: onError.", error);
					this.rewardedVisible = false;
					application.publishEvent("OnRewardedEvent", "Error");
				}
			}).catch((exception) => {
				console.error("Invoke rewarded failed.", exception);
				this.rewardedVisible = false;
				application.publishEvent("OnRewardedEvent", "Error");
				reject(exception);
			});
		});
	}

	// Payments methods.

	resolvePayments() {
		console.log("Payments resolving started.");

	}

	invokePurchase(productTag) {
		console.log("Invoke purchase called.");

	}

	resolveServerProducts() {
		console.log("Server products caching started.");

	}

	resolveServerPurchases() {
		console.log("Server purchases caching started.");

	}

	resolveCacheProducts() {
		return this.cacheProductsData;
	}

	resolveCachePurchases() {
		return this.cachePurchasesData;
	}

	// Saves methods.

	resolveSaves() {
		console.log("Saves resolving started.");
		return new Promise((resolve, reject) => {
			this.sdk.send('VKWebAppStorageGet', {
				keys: this.jsonContainers
			}).then((data) => {
				if (data.keys) {
					for (let i = 0; i < data.keys.length; i++) {
						let keyValuePair = data.keys[i];
						this.cacheContainers[keyValuePair.key] = keyValuePair.value;
					}
					console.log("Saves resolving success.");
					application.publishEvent("OnResolveSaves", "Success");
					resolve(data);
				}
				else {
					console.error("Saves resolving failed.");
					application.publishEvent("OnResolveSaves", "Error");
					reject();
				}
			}).catch((exception) => {
				console.error("Saves resolving failed.", exception);
				application.publishEvent("OnResolveSaves", "Error");
				reject(exception);
			});
		});
	}

	writeSaves() {
		console.log("Write saves called.");
		return new Promise((resolve, reject) => {
			for (let x = 0; x < this.jsonContainers.length; x++) {
				this.sdk.send('VKWebAppStorageSet', {
					key: this.jsonContainers[x],
					value: this.cacheContainers[this.jsonContainers[x]]
				}).then((data) => {
					if (data.result) {
						console.log(`Contaiener with key ${this.jsonContainers[x]} written successfully.`);
						application.publishEvent("OnWriteSaves", "Success");
						resolve(data);
					}
					else {
						console.error("Something went wrong while writing saves.");
						application.publishEvent("OnWriteSaves", "Error");
						reject();
					}
				}).catch((exception) => {
					console.error("Failed to write saves.", exception);
					application.publishEvent("OnWriteSaves", "Error");
					reject(exception);
				});
			}
		});
	}

	resolveCacheSaves(containerTag) {
		console.log("Resolve cache saves called.");
		let containerJSON = this.cacheContainers[containerTag];
		if (containerJSON == null) {
			return "Empty";
		}
		return containerJSON;
	}

	writeCacheSaves(containerTag, json) {
		console.log("Write cache saves called.");
		try {
			this.cacheContainers[containerTag] = json;
			console.log("Cache saves written successfully.");
		}
		catch (exception) {
			console.error("Cache saves write failed.", exception);
		}
	}

	// Language methods.

	#languageCodes = {
		0: "ru",    // Russian
		3: "en",    // English
		20: "ja",   // Japanese
		18: "zh",   // Chinese
		82: "tr",   // Turkish
		76: "hi",   // Hindi
		17: "ko",   // Korean
		12: "pt",   // Portuguese
		69: "id",   // Indonesian
		6: "de",    // German
		4: "es",    // Spanish
		7: "it",    // Italian
		1: "uk",    // Ukrainian
		15: "pl",   // Polish
		16: "fr"    // French
	};

	resolveLanguage() {
		console.log("Resolve language called.");
		try {
			let windowURL = new URL(window.location.href);
			if (windowURL.searchParams.has("language")) {
				let languageValue = windowURL.searchParams.get("language");
				let languageCode = parseInt(languageValue);
				return this.#languageCodes[languageCode];
			}
			else if (windowURL.searchParams.has("vk_language")) {
				let languageValue = windowURL.searchParams.get("vk_language");
				return languageValue;
			}
			else {
				return "ru";
			}
		}
		catch (exception) {
			console.error("Failed to resolve language.", exception);
			return "ru";
		}
	}

	// Socials support.

	shareThisGame() {
		console.log("Share this game called.");
		this.sdk.send('VKWebAppShare', {
			link: window.location.origin + window.location.pathname
		}).then((data) => {
			if (data.result) {
				console.log("Game shared successfully.");
			}
			else {
				console.error("Failed to share game.");
			}
		}).catch((exception) => {
			console.error("Failed to share game.", exception);
		});
	}

}

function initializeWrapper() {
	if (typeof window !== 'undefined') {
		window.vkontakteWrapper = new VkontakteWrapper(() => {
			// Application initialization on wrapper ready callback.
			application.initialize();
		});
	}
}