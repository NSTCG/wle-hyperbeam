import {Component, Texture, Property} from "@wonderlandengine/api";
import {CursorTarget} from "@wonderlandengine/components";
import {vec3} from "gl-matrix";
const HyperbeamPromise = import("@hyperbeam/web");

/**
 * hyperbeam
 */

const tempVec = vec3.create();
export class HyperbeamComponent extends Component {
	static TypeName = "hyperbeam-component";
	static Properties = {
		material: Property.material(),
		marker: Property.object(),
		apiKey: Property.string(),
		defualtTagValue: Property.string(),
		CursorHover: Property.bool(false),
	};
	init() {
		this.hoverFlag = false;
		const hbContainer = document.createElement("div");
		hbContainer.id = "hbcontainer";

		// Now, you can add this div to the document's body or any other parent element you desire.
		document.body.appendChild(hbContainer);
	}

	start() {
		const currentURL = window.location.href;
		this.userType = currentURL.split("?")[1]?.split("#")[0];
		this.tagValue = currentURL.split("#")[1];
		console.log("tag value == " + this.tagValue);
		if (this.tagValue == "" || this.tagValue == undefined) {
			this.tagValue = this.defualtTagValue;
			//console.log("setting Default tag value");
		}
		delete window.MediaStreamTrackProcessor;
		this.getEmbedUrl();
	}
	update() {
		if (this.CursorHover && this.hoverFlag) {
			this.marker.setTranslationWorld(this.currrentCursor.cursorPos);
			const vector = this.marker.getTranslationLocal(tempVec);
			const x = vector[0] / 2 + 0.5;
			const y = -vector[1] / 2 + 0.5;
			hb.sendEvent({
				type: "mousemove",
				x: x,
				y: y,
				button: 0,
			});
		}
	}

	async getEmbedUrl() {
		const apiKey = this.apiKey;
		const tagValue = this.tagValue;
		try {
			const response = await fetch(
				"https://hyperbeam.nithinsteven32.workers.dev/",
				{
					method: "POST",
					body: JSON.stringify({
						apiKey, // Pass the API key to the worker
						tag: tagValue,
					}),
				},
			);

			const responseBody = await response.text();
			//console.log("Response Body:", responseBody); // Log the response body

			try {
				const responseData = JSON.parse(responseBody);
				//console.log(responseData);
				this.embedURL = responseData["embed_url"];
				console.log(this.embedURL);
				this.loadHyperbeam(this.embedURL);
			} catch (error) {
				responseContainer.innerHTML =
					"An error occurred while parsing the response.";
				console.error("Error parsing response:", error);
			}
		} catch (error) {
			responseContainer.innerHTML =
				"An error occurred during the request.";
			console.error("Error during request:", error);
		}
	}

	async loadHyperbeam(embedURL) {
		console.log("loadingHyperBeam");
		// Create a Hyperbeam computer
		const width = this.object.getScalingLocal()[0];
		const height = this.object.getScalingLocal()[1];
		console.log("width: " + width, "height: " + height);
		console.log("test");
		this.flag = true;

		const Hyperbeam = (await HyperbeamPromise).default;

		window.hb = await Hyperbeam(
			document.getElementById("hbcontainer"),
			embedURL,
			{
				frameCb: (frame) => {
					if (this.flag == true) {
						this.texture = new Texture(this.engine, frame);
						this.material.flatTexture = this.texture;
						this.flag = false;
						console.log("starting a frame");
					} else {
						this.texture.update();
					}
				},
			},
		);

		hb.tabs.onUpdated.addListener((tabId, changeInfo) => {
			if (changeInfo.title) console.warn(changeInfo.title);
			console.log(tabId, changeInfo);
			console.warn();
		});

		const onDown = (_, cursor) => {
			console.log(cursor);
			//console.log("cursorPos : " + cursor.cursorPos);
			//console.log("cursorPos: " + cursor.cursorPos);
			this.marker.setTranslationWorld(cursor.cursorPos);
			let vector = this.marker.getTranslationLocal(tempVec);
			const x = vector[0] / 2 + 0.5;
			const y = -vector[1] / 2 + 0.5;
			hb.sendEvent({
				type: "mousedown",
				x: x,
				y: y,
				button: 0,
			});
			//console.log(x, y);
		};

		const onUp = (_, cursor) => {
			console.log(cursor);
			this.marker.setTranslationWorld(cursor.cursorPos);
			const vector = this.marker.getTranslationLocal(tempVec);
			const x = vector[0] / 2 + 0.5;
			const y = -vector[1] / 2 + 0.5;
			hb.sendEvent({
				type: "mouseup",
				x: x,
				y: y,
				button: 0,
			});
		};

		const onHover = (_, cursor) => {
			this.currrentCursor = cursor;
			this.hoverFlag = true;
		};

		const onUnhover = (_, cursor) => {
			this.hoverFlag = false;
		};

		const target =
			this.object.getComponent(CursorTarget) ||
			this.object.addComponent(CursorTarget);
		target.onDown.add(onDown);
		target.onUp.add(onUp);
		target.onHover.add(onHover);
		target.onUnhover.add(onUnhover);
		window.addEventListener("wheel", (e) => {
			hb.sendEvent({
				type: "wheel",
				deltaY: e.deltaY,
			});
		});
	}
}
