module.exports = class {
    static segments = [
        {
            video: [
                {}
            ],

            audio: [
                {
                    channels: [
                        {}, {}
                    ]
                }
            ]
        }
    ];

    static segmentsScale = 2; // 1 * 60px:60m

    static timeHeight = 24;
    static timeHeightMargin = 0;
    static segmentsHeightMargin = 1;
    static segmentsVideoHeight = 64;
    static segmentsVideoMarginHeight = 1;
    static segmentsAudioHeight = 42;
    static segmentsAudioMarginHeight = 1;
    static segmentsAudioChannelMarginHeight = 1;
    static timeTenthHeight = 4;

    static renderSegments() {
        const scale = this.segmentsScale * 60;

        const canvas = document.getElementById("main-segments-canvas");

        const minWidth = canvas.parentElement.getBoundingClientRect().width;

        let height = 0;
        let width = 0;

        // time height
        height += this.timeHeight;

        // time height margin
        if(this.segments.length)
            height += this.timeHeightMargin;

        if(this.segments.length > 1)
            height += (this.segments.length * this.segmentsHeightMargin);
        
        for(let index = 0; index < this.segments.length; index++) {
            if(this.segments[index].video.length)
                height += this.segments[index].video.length * this.segmentsVideoHeight;

            if(this.segments[index].video.length > 1)
                height += this.segments[index].video.length * this.segmentsVideoMarginHeight;

            if(this.segments[index].audio.length > 1)
                height += this.segments[index].audio.length * this.segmentsAudioMarginHeight;

            for(let audio = 0; audio < this.segments[index].audio.length; audio++) {
                height += this.segments[index].audio[audio].channels.length * this.segmentsAudioHeight;

                if(this.segments[index].audio[audio].channels.length > 1)
                    height += this.segments[index].audio[audio].channels.length * this.segmentsAudioChannelMarginHeight;
            }
        }


        if(minWidth > width)
           width = minWidth;

        // start rendering
        let top = 0;
        let left = 0;

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        context.fillStyle = "#242E38";
        context.fillRect(0, 0, width, height);

        {
            context.textBaseline = "middle";

            for(let index = 0; index < width / scale; index++) {
                context.fillStyle = "#25282B";
                context.fillRect(index * scale, 0, scale, this.timeHeight);

                context.fillStyle = "#474B4E";
                context.fillText(`00:${index}.00`, index * scale + 6, Math.floor(this.timeHeight / 2));

                const tenthWidth = scale / 10;

                for(let tenth = 1; tenth < 10; tenth++) {
                    context.strokeStyle = "#474B4E";
                    context.strokeRect((index * scale) + (tenth * (scale / 10)) - 0.5, this.timeHeight - this.timeTenthHeight - 1, 0, this.timeTenthHeight);
                }

                context.strokeStyle = "#1C1E20";
                context.strokeRect(index * scale, 0, scale, this.timeHeight);
            }

            top += this.timeHeight + this.timeHeightMargin;
        }

        {
            for(let index = 0; index < this.segments.length; index++) {
                if(index != 0) {
                    context.strokeStyle = "#1C1E20";
                    context.strokeRect(0, top, width - 1, this.segmentsHeightMargin);

                    top += this.segmentsHeightMargin;
                }

                for(let video = 0; video < this.segments[index].video.length; video++) {
                    if(video != 0)
                        top += this.segmentsVideoMarginHeight;

                    context.fillStyle = "#25282B";
                    context.fillRect(0, top, width, this.segmentsVideoHeight);

                    top += this.segmentsVideoHeight;
                }

                if(this.segments[index].video.length != 0) {
                    context.strokeStyle = "#1C1E20";
                    context.strokeRect(0, top + 0.5, width - 1, this.segmentsVideoMarginHeight);

                    top += this.segmentsVideoMarginHeight;
                }

                for(let audio = 0; audio < this.segments[index].audio.length; audio++) {
                    if(audio != 0) {
                        context.strokeStyle = "#1C1E20";
                        context.strokeRect(0, top + 0.5, width - 1, this.segmentsAudioMarginHeight);
    
                        top += this.segmentsAudioMarginHeight;
                    }

                    for(let channel = 0; channel < this.segments[index].audio[audio].channels.length; channel++) {
                        if(channel != 0) {
                            context.strokeStyle = "#1C1E20";
                            context.strokeRect(0, top + 0.5, width - 1, this.segmentsAudioChannelMarginHeight);
        
                            top += this.segmentsAudioChannelMarginHeight;
                        }
                    
                        context.fillStyle = "#25282B";
                        context.fillRect(0, top, width, this.segmentsAudioHeight);
    
                        top += this.segmentsAudioHeight;
                    }
                }
            }
        }

        context.strokeStyle = "#1C1E20";
        context.strokeRect(0, 0, width - 1, height);
    };
};
