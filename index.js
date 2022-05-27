const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const ipc = require("electron").ipcMain;
const { v4: uuidv4 } = require("uuid");

const global = require("./modules/global.js");
const Project = require("./modules/project.js");

// in this file you will see local wrappings that may seem to have no real purpose and look messy
// but this is to ensure that any variables defined doesn't interfere with any code further down
// as there's operations that only every is performed on application start and thus don't deserve
// their own functions just to be called once.

// ensure we have our folders and required files
{
	if(!fs.existsSync(global.projectsDirectory))
		fs.mkdirSync(global.projectsDirectory);
	
	if(!fs.existsSync(global.projectsCacheFile))
		fs.writeFileSync(global.projectsCacheFile, JSON.stringify({projects: []}));
}

// read the name and modified data from all projects listed in the cache
{
	global.projects = [];

	const projectsCache = JSON.parse(fs.readFileSync(global.projectsCacheFile));

	for(let index = 0; index < projectsCache.length; index++) {
		const id = projectsCache[index];
		const file = path.join(global.projectsDirectory, `${id}/project.json`);

		const projectManifest = JSON.parse(fs.readFileSync(file));

		global.projects.push({
			id: id,
			name: projectManifest.name,
			modified: projectManifest.modified
		});
	}

	global.sortProjects();
}

function createWindow() {
	global.window = new BrowserWindow({
		width: 800,
		height: 600,
		frame: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true,
			preload: path.join(__dirname, "www/scripts/preload.js")
		}
	});

	global.window.loadFile("www/index.html");

	ipc.on("projects-list", function(event) {
		event.reply("projects-list", global.projects);
    });

	ipc.on("projects-create", function(event, name) {
		let id = uuidv4();

		while(global.projects.find(x => x.id == id) != null)
			id = uuidv4();

		const project = {
			id: id,
			name: name,
			modified: new Date().getTime()
		};

		fs.mkdirSync(path.join(global.projectsDirectory, id));
		fs.writeFileSync(path.join(global.projectsDirectory, `${id}/project.json`), JSON.stringify({
			name: name,
			modified: new Date().getTime()
		}));
		
		global.projects.push(project);

		global.sortProjects();
		global.saveProjectsCache();

		global.project = new Project(id);

		event.reply("projects-show", global.project.data.name);
	});

	ipc.on("projects-show", function(event, id) {
		global.project = new Project(id);

		event.reply("projects-show", global.project.data.name);
	});

	ipc.on("project-files-add", function(event) {
		dialog.showOpenDialog({
			properties: ["openFile", "multiSelections"],
			
			filters: [
				{ name: "Video Files", extensions: ["mkv", "avi", "mp4"] },
				{ name: "Image Files", extensions: ["jpg", "png", "gif"] },
				{ name: "Audio Files", extensions: ["m4a", "flac", "mp3", "mp4", "wav", "wma", "aac"] }
			],
		}).then(function (response) {
			console.log(response);
			if(response.canceled || response.filePaths.length == 0)
				return;

			for(let index = 0; index < response.filePaths.length; index++) {
				global.project.addFile(response.filePaths[index]);
			}
		});
	});

	ipc.on("project-file", function(event, id, message) {
		event.reply(`project-file:${message}`, global.project.data.files[id]);
	});

	ipc.on("window-minimize", function(event) {
		global.window.minimize();
    });

	ipc.on("window-maximize", function(event) {
        if(global.window.isMaximized())
			global.window.unmaximize();
        else
            global.window.maximize();
    });

	ipc.on("window-close", function(event) {
		global.window.close();
    });
};

app.whenReady().then(() => {
	createWindow();

	app.on("activate", function () {
		if(BrowserWindow.getAllWindows().length === 0)
			createWindow();
	});
});

app.on("window-all-closed", function () {
	if(process.platform !== "darwin")
		app.quit();
});