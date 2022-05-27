const electron = require("electron");
const ipc = electron.ipcRenderer;

const global = require("./global.js");

global.project = require("./project.js");
global.segments = require("./segments.js");
global.files = require("./files.js");
	
window.addEventListener('DOMContentLoaded', () => {
	const main = document.querySelector("main");
	const mainLoader = document.getElementById("main-loader");
	const mainOverlay = document.getElementById("main-overlay");
	const mainProjects = document.getElementById("main-projects");


	const title = document.querySelector("title").innerHTML;
    
    document.querySelector("#header-title").innerHTML = title;
    
    document.querySelector("#header-button-minimize").addEventListener("click", () => {
        ipc.send("window-minimize");
    });
    
    document.querySelector("#header-button-maximize").addEventListener("click", () => {
        ipc.send("window-maximize");
    });
    
    document.querySelector("#header-button-close").addEventListener("click", () => {
        ipc.send("window-close");
    });

	document.getElementById("main-files-add-button").addEventListener("click", () => {
		ipc.send("project-files-add");
	});

	let requestingAnimationFrame = false;

	window.addEventListener("resize", () => {
		if(requestingAnimationFrame == true)
			window.cancelAnimationFrame();

		requestingAnimationFrame = true;
		
		window.requestAnimationFrame(() => {
			requestingAnimationFrame = false;
			
			global.project.renderSegments();
		});
	});

	document.getElementById("main-projects-new-create").addEventListener("click", () => {
		const name = document.getElementById("main-projects-new-name");

		if(name.value.length == 0) {
			const error = document.getElementById("main-projects-new-error");

			error.innerText = "You must enter a project name!";

			return;
		}

		mainLoader.innerText = `Creating project ${name.value}...`;
		mainLoader.classList.add("active");

		ipc.send("projects-create", name.value);
	});

	ipc.on("project-files", (event, files) => {
		global.files.setFiles(files);
	});

	ipc.on("projects-show", (event, name) => {
		mainLoader.classList.remove("active");
		mainOverlay.classList.remove("active");
		mainProjects.classList.remove("active");

		document.querySelector("#header-title").innerHTML = `${name} - ${title}`;

		{
			global.project.renderSegments();

			/*const segment = global.segments.createSegment();
	
			global.segments.addSegmentVideo(segment);
			global.segments.addSegmentAudio(segment);
			global.segments.addSegmentAudio(segment);
	
			global.segments.refreshSegments();*/
		}
	});

	ipc.on("project-file-status", (event, id, active, message) => {
		const element = document.querySelector(`[data-file="${id}"]`);
		
		const overlay = element.querySelector(".main-files-item-overlay");
		
		overlay.innerText = message;

		if(active)
			overlay.classList.add("active");
		else
			overlay.classList.remove("active");
	});

	ipc.on("project-file-updated", (event, file) => {
		const element = document.querySelector(`[data-file="${file.id}"]`);

		element.innerHTML = `
			<div class="main-files-item-thumbnail">
				<img src="${file.thumbnail}">
			</div>

			<div class="main-files-item-information">
				<div class="main-files-item-name">${file.name}</div>
			</div>

			<div class="main-files-item-overlay"></div>
		`;

		if(file.type == "video") {
			const information = element.querySelector(".main-files-item-information");

			information.innerHTML += `
				<div class="main-files-item-resolution">Resolution: ${file.metadata?.video?.resolution?.w}x${file?.metadata?.video?.resolution?.h} (${file?.metadata?.video?.aspect?.x}:${file?.metadata?.video?.aspect?.y})</div>
				<div class="main-files-item-length">Duration: ${file?.metadata?.duration?.raw} (${file?.metadata?.video?.fps})</div>
			`;
		}
	});

	ipc.on("project-file-added", (event, id, type) => {
		if(type == "image" || type == "video") {
			const mainFilesVideosEmpty = document.getElementById("main-files-videos-empty");
			mainFilesVideosEmpty.classList.remove("active");

			const mainFilesVideosContent = document.getElementById("main-files-videos-content");
			mainFilesVideosContent.classList.add("active");
			
			const element = document.createElement("div");
			element.className = "main-files-item";
			element.setAttribute("data-file", id);

			element.addEventListener("mousedown", (event) => {
				//mainOverlay.classList.add("active");

				const timestamp = performance.now();

				ipc.on(`project-file:${timestamp}`, (ipcEvent, file) => {
					console.log(file);

					const element = document.createElement("div");
					element.className = "file-segment-add";
					element.innerHTML = `
						<div class="file-segment-add-thumbnail">
							<img src="${file.thumbnail}">
						</div>
					`;

					function mousemove(event) {
						element.style.left = `${event.pageX}px`;
						element.style.top = `${event.pageY}px`;
					};

					function mouseup(event) {
						document.body.removeEventListener("mousemove", mousemove);
						document.body.removeEventListener("mouseup", mouseup);

						element.remove();
					};

					document.body.addEventListener("mousemove", mousemove);
					document.body.addEventListener("mouseup", mouseup);

					mousemove(event);

					document.body.append(element);
				});

				ipc.send("project-file", id, timestamp);
			});

			mainFilesVideosContent.append(element);
		}
	});

	ipc.on("projects-list", (event, projects) => {
		if(projects.length == 0) {
			const mainProjectsEmpty = document.getElementById("main-projects-empty");
			
			mainProjectsEmpty.classList.add("active");
		}
		else {
			const mainProjectsList = document.getElementById("main-projects-list");

			mainProjectsList.classList.add("active");

			projects.sort((a, b) => { return a.modified - b.modified; });

			for(let index = 0; index < projects.length; index++) {
				const element = document.createElement("div");
				element.className = "main-projects-card";

				element.innerHTML = `
					<div class="main-projects-card-thumbnail"></div>

					<div class="main-projects-card-name">${projects[index].name}</div>
					<div class="main-projects-card-modified">${new Date(projects[index].modified).toLocaleString()}</div>
				`;

				element.addEventListener("click", () => {
					ipc.send("projects-show", projects[index].id);
				});

				mainProjectsList.append(element);
			}
		}

		mainLoader.classList.remove("active");

		console.log(projects);
	});

	mainLoader.innerText = "Reading projects...";
	mainLoader.classList.add("active");

	ipc.send("projects-list");
  });
