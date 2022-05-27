const electron = require("electron");
const ipc = electron.ipcRenderer;
const global = require("./global.js");

class Files {
    static files = {};

    static setFiles(files) {
        document.getElementById("main-files-videos-empty").classList.add("active");
        document.getElementById("main-files-videos-content").classList.remove("active");

        for(let id in this.files) {
            this.files[id].element.remove();
        }

        this.files = {};

        for(let id in files) {
            this.addFile(files[id]);
        }
    };

    static addFile(data) {
        this.files[data.id] = { data };

        this.files[data.id].element = document.createElement("div");
        this.files[data.id].element.className = "main-files-item";
        this.files[data.id].element.setAttribute("data-file", this.files[data.id].data.id);

        this.files[data.id].element.innerHTML = `
			<div class="main-files-item-thumbnail">
				<img src="${this.files[data.id].data.thumbnail}">
			</div>

			<div class="main-files-item-information">
				<div class="main-files-item-name">${this.files[data.id].data.name}</div>
			</div>

			<div class="main-files-item-overlay"></div>
		`;

        this.files[data.id].element.addEventListener("mousedown", (event) => {
            global.segments.dragFile(data.id, event);
        });

		if(this.files[data.id].data.type == "video") {
			const information = this.files[data.id].element.querySelector(".main-files-item-information");

			information.innerHTML += `
				<div class="main-files-item-resolution">Resolution: ${this.files[data.id].data.metadata?.video?.resolution?.w}x${this.files[data.id].data?.metadata?.video?.resolution?.h} (${this.files[data.id].data?.metadata?.video?.aspect?.x}:${this.files[data.id].data?.metadata?.video?.aspect?.y})</div>
				<div class="main-files-item-length">Duration: ${this.files[data.id].data?.metadata?.duration?.raw} (${this.files[data.id].data?.metadata?.video?.fps})</div>
			`;
		}

        if(this.files[data.id].data.type == "video" || this.files[data.id].data.type == "image") {
			document.getElementById("main-files-videos-empty").classList.remove("active");
			document.getElementById("main-files-videos-content").classList.add("active");

            document.getElementById("main-files-videos-content").append(this.files[data.id].element);
        }

        return this.files[data.id].data;
    };
};

module.exports = Files;
