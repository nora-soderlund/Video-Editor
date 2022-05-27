const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const ipc = require("electron").ipcMain;
const ffmpeg = require("ffmpeg");

const global = require("./global.js");

module.exports = class {
    id;
    path;
    data;

    filesPath;

    constructor(id) {
        this.id = id;

        this.path = path.join(global.projectsDirectory, id);
        this.data = JSON.parse(fs.readFileSync(path.join(this.path, "project.json")));
        
        this.filesPath = path.join(this.path, "files");
        
        if(!fs.existsSync(this.filesPath))
            fs.mkdirSync(this.filesPath);

        if(!this.data.hasOwnProperty("files"))
            this.data.files = {};
        
        global.window.webContents.send("project-files", this.data.files);
    };

    addFile(file) {
        let id = uuidv4();

        while(this.data.files.hasOwnProperty(id))
            id = uuidv4();

        const extension = (file.substring(file.lastIndexOf('.') + 1, file.length)).toLowerCase();

        const newPath = path.join(this.filesPath, `${id}.${extension}`);

        let type;

        switch(extension) {
            case "mkv":
            case "avi":
            case "mp4":
                type = "video";
                break;
                
            case "jpg":
            case "png":
            case "gif":
                type = "image";
                break;
                
            case "m4a":
            case "flac":
            case "mp3":
            case "mp4":
            case "wav":
            case "wma":
            case "aac":
                type = "audio";
                break;
        }

        this.data.files[id] = {
            id: id,
            name: path.parse(file).name,
            extension,
            original: file,
            type,
            file: newPath,
            added: new Date().getTime()
        };

        fs.writeFileSync(path.join(this.path, "project.json"), JSON.stringify(this.data));

        global.window.webContents.send("project-file-added", id, this.data.files[id].type);
        global.window.webContents.send("project-file-updated", this.data.files[id]);
        global.window.webContents.send("project-file-status", id, true, "Preparing...");
        
        fs.copyFile(file, newPath, (error) => {
            if(this.data.files[id].type == "image") {
                this.data.files[id].thumbnail = this.data.files[id].file;

                fs.writeFileSync(path.join(this.path, "project.json"), JSON.stringify(this.data));

                global.window.webContents.send("project-file-updated", this.data.files[id]);
        
                global.window.webContents.send("project-file-status", id, false, "");
            }
            else if(this.data.files[id].type == "video") {
                this.data.files[id].audio = path.join(this.filesPath, `${id}.mp3`);
                this.data.files[id].frames = path.join(this.filesPath, `${id}`);

                fs.writeFileSync(path.join(this.path, "project.json"), JSON.stringify(this.data));
                
                try {
                    new ffmpeg(this.data.files[id].file, (err, video) => {
                        if (!err) {
                            console.log('The video is ready to be processed');
                            // Video metadata
                            this.data.files[id].metadata = video.metadata;
                            // FFmpeg configuration
                            console.log(video.info_configuration);
                            fs.mkdirSync(this.data.files[id].frames);

                            video.fnExtractFrameToJPG(this.data.files[id].frames, {
                                file_name: "i"
                            }, (error, files) => {
                				if (error)
                                    console.log(error);
                                
                                console.log(files);

                                this.data.files[id].thumbnail = files[0];
                                fs.writeFileSync(path.join(this.path, "project.json"), JSON.stringify(this.data));
                                
                                global.window.webContents.send("project-file-updated", this.data.files[id]);

                                video.fnExtractSoundToMP3(this.data.files[id].audio, (error) => {
                                    if (error)
                                        console.log(error);
                        
                                    global.window.webContents.send("project-file-status", id, false, "");
                                });
                            });
                        } else {
                            console.log('Error: ' + err);
                        }
                    });
                } catch (e) {
                    console.log(e.code);
                    console.log(e.msg);
                }
            }
        });
    };

    export() {
        return {
            id: this.id,
            name: this.name,
            modified: new Date().getTime()
        };
    };
};
