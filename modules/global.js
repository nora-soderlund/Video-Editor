const { app } = require("electron");
const path = require("path");
const fs = require("fs");

module.exports = class {
    static userData = app.getPath("userData");

    static project;
    static projects = [];
    static projectsDirectory = path.join(this.userData, "Projects");
    static projectsCacheFile = path.join(this.projectsDirectory, "cache.json");

    static sortProjects() {
		this.projects = this.projects.sort((a, b) => { return b.modified - a.modified; });
    };

    static saveProjectsCache() {
        console.log(this.projects);
		let projects = [];
		
		for(let index = 0; index < this.projects.length; index++)
			projects.push(this.projects[index].id);

		fs.writeFileSync(this.projectsCacheFile, JSON.stringify(projects));
    };
};
