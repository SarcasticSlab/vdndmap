class EffectHandler {
	constructor() {
        this.imageLayer = document.getElementById("image-layer");
        this.ctx = this.imageLayer.getContext("2d");
        this.ctx.willReadFrequently = true; // For performance optimization
		this.trigger = this.trigger.bind(this);
	}
    trigger() {
        //var coor = {x: Math.floor(Math.random() * this.imageLayer.clientWidth * 0.5 + 100), y: Math.floor(Math.random() * this.imageLayer.clientHeight * 0.5 + 100)};
        var coor = {x: 100, y: 100};
        for (var lineStep=0; lineStep < 10; lineStep++) {
            var angle = Math.random() * 2 * Math.PI;
            var length = 15;
            var color = `red`;
            coor = this.drawLineDir(coor.x, coor.y, length, angle, color, 5);
            console.log(`Line Step ${lineStep}: (${coor.x}, ${coor.y})`);
        }
    }
    getPxData(coor) {
        const pxData = this.ctx.getImageData(coor.x, coor.y, 1, 1).data;
        return pxData;
    }
    drawLine(x1, y1, x2, y2, color = 'black', width = 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();
        this.ctx.closePath();
    }
    drawCircle(x, y, radius, color = 'black', width = 1, fill = false) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();
    }
    drawSquare(x, y, size, color = 'black', width = 1, fill = false) {
        this.ctx.beginPath();
        this.ctx.rect(x, y, size, size);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();
    }
    drawTriangle(x1, y1, x2, y2, x3, y3, color = 'black', width = 1, fill = false) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineTo(x3, y3);
        this.ctx.closePath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();
    }
    drawRectangle(x, y, width, height, color = 'black', width2 = 1, fill = false) {
        this.ctx.beginPath();
        this.ctx.rect(x, y, width, height);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width2;
        this.ctx.stroke();
    }
    drawLightning(x1, y1, x2, y2, color = 'yellow', width = 2) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        this.ctx.lineTo(midX, y1 - 20);
        this.ctx.lineTo(midX + 10, midY);
        this.ctx.lineTo(midX, y2 + 20);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();
        this.ctx.closePath();
    }

    drawTriangleDir(x, y, sideLength, angle, color = 'black', width = 1, fill = false) {
        const r = sideLength / (Math.sqrt(3)); // radius from center to each vertex
        const angles = [angle, angle + (2 * Math.PI / 3), angle + (4 * Math.PI / 3)];

        const points = angles.map(a => ({
            x: x + r * Math.cos(a),
            y: y + r * Math.sin(a)
        }));

        this.drawTriangle(
            this.ctx,
            points[0].x, points[0].y,
            points[1].x, points[1].y,
            points[2].x, points[2].y,
            color, width, fill
        );
    }

    drawLineDir(x, y, length, angle, color = 'black', width = 1) {
        const x2 = x + length * Math.cos(angle);
        const y2 = y + length * Math.sin(angle);
        if (this.getPxData({x: x2, y: y2})[0] == 0) {
            this.drawLine(x, y, x2, y2, color, width);
            return {x:x2,y:y2};
        };
            console.log("Err");
        return {x:x,y:y};
    }

    deg2rad(degrees) {
        return degrees * (Math.PI / 180);
    }
    getAngleBetweenPoints(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

}