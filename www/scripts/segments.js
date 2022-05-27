const global = require("./global.js");

class Segments {
	static segments = [];

	static videoSegmentHovered = null;
	
	static createSegment() {
		const element = document.createElement("div");
		element.className = "main-segments-group";
		element.innerHTML = `
			<div class="main-segments-group-videos"></div>
			<div class="main-segments-group-audios"></div>
		`;

		document.querySelector("#main-segments .main-segments-container").append(element);

		const segment = {
			element,
			videoElement: element.querySelector(".main-segments-group-videos"),
			audioElement: element.querySelector(".main-segments-group-audios"),

			video: [],
			audio: []
		};

		this.segments.push(segment);

		return segment;
	};

	static addSegmentVideo(segment) {
		const element = document.createElement("div");

		element.className = "main-segments-section main-segments-section-video";
		element.innerHTML = `
			<div class="main-segments-section-id">V</div>
			<div class="main-segments-section-segment"></div>
		`;

		segment.videoElement.append(element);

		const video = {
			element
		};

		element.querySelector(".main-segments-section-segment").addEventListener("mouseenter", (event) => {
			this.videoSegmentHovered = {
				segment, video
			};
		});

		element.querySelector(".main-segments-section-segment").addEventListener("mouseleave", (event) => {
			if(this.videoSegmentHovered.segment == segment && this.videoSegmentHovered.video == video)
				this.videoSegmentHovered = null;
		});

		segment.video.push(video);

		return video;
	};

	static addSegmentAudio(segment) {
		const element = document.createElement("div");

		element.className = "main-segments-section main-segments-section-audio";
		element.innerHTML = `
			<div class="main-segments-section-id">A</div>
			<div class="main-segments-section-segment"></div>
		`;

		segment.audioElement.append(element);

		const audio = {
			element
		};

		segment.audio.push(audio);

		return audio;
	};

	static refreshSegments() {
		let video = 1;
		let audio = 1;

		for(let segment = 0; segment < this.segments.length; segment++) {
			for(let index = 0; index < this.segments[segment].video.length; index++) {
				this.segments[segment].video[index].element.querySelector(".main-segments-section-id").innerHTML = `V${video}`;

				video++;
			}
				
			for(let index = 0; index < this.segments[segment].audio.length; index++) {
				this.segments[segment].audio[index].element.querySelector(".main-segments-section-id").innerHTML = `A${audio}`;

				audio++;
			}
		}
	};

	static dragFile(id, event) {
		const element = document.createElement("div");
		element.className = "file-segment-add";
		element.innerHTML = `
			<div class="file-segment-add-thumbnail">
				<img src="${global.files.files[id].data.thumbnail}">
			</div>
		`;

		let lockedSegment = null;

		const segment = document.createElement("div");
		segment.className = "main-segments-drop";
		segment.innerHTML = `Drop to create a new segment group for this file...`;
		document.querySelector("#main-segments .main-segments-container").appendChild(segment);

		const mousemove = (event) => {
			let x = event.pageX;
			let y = event.pageY;

			if(this.videoSegmentHovered != null) {
				if(global.files.files[id].data.type == "video" || global.files.files[id].data.type == "image" && this.videoSegmentHovered.video != undefined) {
					y = this.videoSegmentHovered.video.element.querySelector(".main-segments-section-segment").getBoundingClientRect().top + window.scrollY + Math.floor(element.getBoundingClientRect().height / 2);
				}
			}
			element.style.left = `${x}px`;
			element.style.top = `${y}px`;
		};

		const mouseup = (event) => {
			document.body.removeEventListener("mousemove", mousemove);
			document.body.removeEventListener("mouseup", mouseup);

			element.remove();
			segment.remove();
		};

		document.body.addEventListener("mousemove", mousemove);
		document.body.addEventListener("mouseup", mouseup);

		mousemove(event);

		document.body.append(element);
	};
};

module.exports = Segments;
