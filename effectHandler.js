class EffectHandler {
	constructor(tokenHandler) {
        this.imageLayer = document.getElementById("image-layer");
        this.ctx = this.imageLayer.getContext("2d");
        this.ctx.willReadFrequently = true; // For performance optimization
		this.tokenHandler = tokenHandler;

        this.trigger = this.trigger.bind(this);
        this.state = null;
        this.effect = null;
        this.listOfEffects = [/*'claws', 'growingDots', 'spikyTriangle','hexagons','lines', */'void'];
        this.dotHistory = {};
	}
    getRandomEffect() {
        return this.listOfEffects[Math.floor(Math.random() * this.listOfEffects.length)];
    }

    trigger() {
        const clawLength = 250;
        const clawPadding = 50;
        const dotSizeIncrease = 75;
        const triangleSideLength = 30;
        const triangleSpikeLength = 250;
        const hexagonLength = 150;
        const hexagonSideLength = 50;
        const linesStepLength = 3;
        const linesWidth = 5;
        const voidWidth = 5;

        if (this.state == null) {
            this.effect = this.getRandomEffect();
            this.ctx.clearRect(0, 0, this.imageLayer.clientWidth, this.imageLayer.clientHeight);
                this.dotHistory = {}; // Reset dot history
            if (this.effect == 'claws') {
                this.createClaw(clawLength, clawPadding, 'red', 1);
                this.state = 1;
            } else if (this.effect == 'growingDots') {
                this.createGrowingDots(dotSizeIncrease, 'red', 2);
                this.state = 2;
            } else if (this.effect == 'spikyTriangle') {
                this.createSpikyTriangle(triangleSpikeLength, triangleSideLength, 'red', 1);
                this.state = 1;
            } else if (this.effect == 'hexagons') {
                var coors = {x: Math.floor(Math.random() * this.imageLayer.clientWidth * 0.8 + 0.1 * this.imageLayer.clientWidth),
                             y: Math.floor(Math.random() * this.imageLayer.clientHeight * 0.8 + 0.1 * this.imageLayer.clientHeight)};
                this.dotHistory[`${coors.x},${coors.y}`] = {angle: Math.random() * 2 * Math.PI, initial: true};
                this.createHexagon(hexagonLength, hexagonSideLength, 'red', 1);
                this.state = 1;
            } else if (this.effect == 'lines') {
                this.state = 1;
                this.createLines('orange', 2, linesWidth, false, null);
            } else if (this.effect == 'void') {
                this.state = 0;
                this.createVoid('darkgray', voidWidth);
            }
        } else if (this.effect == 'claws') {
            this.state+=2;
            this.createClaw(clawLength, clawPadding, 'red', this.state);
            if (this.state > 6 && Math.random() * 10 <= 5) this.clearState();
        } else if (this.effect == 'growingDots') {
            this.state+=2;
            this.createGrowingDots(dotSizeIncrease, 'red', this.state);
            if (this.state > 8 && Math.random() * 10 <= 5) this.clearState();
        } else if (this.effect == 'spikyTriangle') {
            this.state++;
            this.createSpikyTriangle(triangleSpikeLength, triangleSideLength, 'red', this.state);
            if (this.state > 3 && Math.random() * 10 <= 5) this.clearState();
        } else if (this.effect == 'hexagons') {
            this.state++;
            this.createHexagon(hexagonLength, hexagonSideLength, 'red', this.state);
            if (this.state > 4 && Math.random() * 10 <= 5) this.clearState();
        } else if (this.effect == 'lines') {
            this.state++;
            this.createLines('red', this.state, linesWidth, true, linesStepLength);
            if (this.state > 4 && Math.random() * 10 <= 5) this.clearState();
        } else if (this.effect == 'void') {
            this.state++;
            this.createVoid('darkgray', voidWidth);
            if (this.state > 3) this.clearState();
        }
    }
    createClaw(length = 250, padding = 50, color = 'red', amount = 1) {
        for (var i = 0; i < amount; i++) {
            var angle = Math.random() * 2 * Math.PI;
            var coor = {x: Math.floor(Math.random() * this.imageLayer.clientWidth * 0.8 + 0.1 * this.imageLayer.clientWidth), 
                        y: Math.floor(Math.random() * this.imageLayer.clientHeight * 0.8 + 0.1 * this.imageLayer.clientHeight)};
            var coor2 = {x: coor.x + padding * Math.cos(angle+Math.PI/2),
                         y: coor.y + padding * Math.sin(angle+Math.PI/2) }
            var coor3 = {x: coor.x - padding * Math.cos(angle+Math.PI/2),
                         y: coor.y - padding * Math.sin(angle+Math.PI/2) }
            console.log(coor, coor2, coor3);
            coor = this.drawLineDir(coor.x, coor.y, length, angle, color, 5);
            coor2 = this.drawLineDir(coor2.x, coor2.y, length, angle, color, 5);
            coor3 = this.drawLineDir(coor3.x, coor3.y, length, angle, color, 5);
        }
    }
    createGrowingDots(radius = 25, color = 'red', amount = 10) {
        for (const key in this.dotHistory) {
            this.dotHistory[key].radius += radius;
        }
        for (var i = 0; i < amount; i++) {
            var coor = {x: Math.floor(Math.random() * this.imageLayer.clientWidth * 0.8 + 0.1 * this.imageLayer.clientWidth),
                        y: Math.floor(Math.random() * this.imageLayer.clientHeight * 0.8 + 0.1 * this.imageLayer.clientHeight)};
            if (`${coor.x},${coor.y}` in this.dotHistory) {
                // If the dot already exists, increase its radius and step
                this.dotHistory[`${coor.x},${coor.y}`].radius += radius;
            } else {
                // If the dot does not exist, create it
                this.dotHistory[`${coor.x},${coor.y}`] = {radius: radius, color: color};
            }
        }
        for (const key in this.dotHistory) {
            const dot = this.dotHistory[key];
            this.drawCircle(parseInt(key.split(',')[0]), parseInt(key.split(',')[1]), dot.radius, dot.color, 1, true);
        }
    }
    createSpikyTriangle(length = 250, sideLength = 30, color = 'red', amount = 1) {
        var tokens = this.tokenHandler.getTokens();
        for (const key in this.dotHistory) {
            const obj = this.dotHistory[key];
            this.drawTriangleDir(parseInt(key.split(',')[0]), parseInt(key.split(',')[1]), sideLength, obj.angle, color, 5, true);
            this.drawLineDir(parseInt(key.split(',')[0]), parseInt(key.split(',')[1]), length, obj.angle, color, 5);
            this.drawLineDir(parseInt(key.split(',')[0]), parseInt(key.split(',')[1]), length, obj.angle + 2 * Math.PI / 3, color, 5);
            this.drawLineDir(parseInt(key.split(',')[0]), parseInt(key.split(',')[1]), length, obj.angle - 2 * Math.PI / 3, color, 5);
        }
        for (const token in tokens) {
            for (var i = 0; i < amount; i++) {
                var coors = tokens[token].getCoors();
                var angle = Math.random() * 2 * Math.PI;
                var triangleCoors = {x: coors.x + (0.5 * length) * Math.cos(angle+Math.PI/2),
                                     y: coors.y + (0.5 * length) * Math.sin(angle+Math.PI/2) }
                var targetAngle = this.getAngleBetweenPoints(triangleCoors.x, triangleCoors.y, coors.x, coors.y);
                this.dotHistory[`${triangleCoors.x},${triangleCoors.y}`] = {angle: targetAngle};
                this.drawTriangleDir(triangleCoors.x,triangleCoors.y, sideLength, targetAngle, color, 5, true);
            }
        }
    }
    createHexagon(length = 250, sideLength = 30, color = 'red', amount = 1) {
        for (var i = 0; i < amount; i++) {
            for (const key in this.dotHistory) {
                const obj = this.dotHistory[key];
                this.drawTriangleDir(parseInt(key.split(',')[0]), parseInt(key.split(',')[1]), sideLength, obj.angle, color, 5, true);
                if (obj.initial) {
                    var coor1 = this.drawLineDir(parseInt(key.split(',')[0]), parseInt(key.split(',')[1]), length, obj.angle, color, 5);
                    var coor2 = this.drawLineDir(parseInt(key.split(',')[0]), parseInt(key.split(',')[1]), length, obj.angle + 2 * Math.PI / 3, color, 5);
                    var coor3 = this.drawLineDir(parseInt(key.split(',')[0]), parseInt(key.split(',')[1]), length, obj.angle - 2 * Math.PI / 3, color, 5);
                    this.dotHistory[`${coor1.x},${coor1.y}`] = {angle: obj.angle + Math.PI, initial: false};
                    this.dotHistory[`${coor2.x},${coor2.y}`] = {angle: obj.angle + Math.PI + 2 * Math.PI / 3, initial: false};
                    this.dotHistory[`${coor3.x},${coor3.y}`] = {angle: obj.angle + Math.PI - 2 * Math.PI / 3, initial: false};
                } else {
                    var coor2 = this.drawLineDir(parseInt(key.split(',')[0]), parseInt(key.split(',')[1]), length, obj.angle + 2 * Math.PI / 3, color, 5);
                    var coor3 = this.drawLineDir(parseInt(key.split(',')[0]), parseInt(key.split(',')[1]), length, obj.angle - 2 * Math.PI / 3, color, 5);
                    this.dotHistory[`${coor2.x},${coor2.y}`] = {angle: obj.angle + Math.PI + 2 * Math.PI / 3, initial: false};
                    this.dotHistory[`${coor3.x},${coor3.y}`] = {angle: obj.angle + Math.PI - 2 * Math.PI / 3, initial: false};
                }
                delete this.dotHistory[key]; // Remove the old dot to prevent clutter
            }
        }
    }
    createLines(color = 'red', amount = 2, width = 5, blockable = true, stepLength = 4) {
        for (var i = 0; i < amount; i++) {
            var startSide = Math.floor(Math.random() * 4);
            if (startSide == 0 || startSide == 2) { // Top or Bottom
                var x = Math.floor(Math.random() * this.imageLayer.clientWidth);
                var xTarget = Math.floor(Math.random() * this.imageLayer.clientWidth);
                var angle = this.getAngleBetweenPoints(x, 0, xTarget, this.imageLayer.clientHeight);
                var y = (startSide == 0) ? 0 : this.imageLayer.clientHeight;
                //var angle = Math.random() * Math.PI / 2 + Math.PI / 4 + (1 - startSide) * Math.PI; // Random angle
                this.drawLineDir(x, y, 5000, angle, color, width, blockable, stepLength);
            } else {
                var y = Math.floor(Math.random() * this.imageLayer.clientHeight);
                var yTarget = Math.floor(Math.random() * this.imageLayer.clientHeight);
                var angle = this.getAngleBetweenPoints(0, y, this.imageLayer.clientWidth, yTarget);
                //var angle = Math.random() * Math.PI / 2 + 3 * Math.PI / 4 + (3 - startSide) * Math.PI / 2; // Random angle
                var x = (startSide == 1) ? 0 : this.imageLayer.clientWidth;
                var angle = Math.random() * Math.PI /2 + 3 * Math.PI / 4 + (3 - startSide) * Math.PI / 2;
                this.drawLineDir(x, y, 5000, angle, color, width, blockable, stepLength);
            }
        }
    }
    createVoid(color = 'red', width = 5) {
        const cW = this.imageLayer.clientWidth;
        const cH = this.imageLayer.clientHeight;
        console.log(this.state);
        if (this.state == 0) {
            var coor1 = {x: Math.floor( Math.random() * 0.5 * cW),
                        y: Math.floor( Math.random() * 0.5 * cH)};
            var coor2 = {x: Math.floor((Math.random() * 0.5 + 0.5) * cW),
                        y: Math.floor( Math.random() * 0.5 * cH)};
            var coor3 = {x: Math.floor((Math.random() * 0.5 + 0.5) * cW),
                        y: Math.floor((Math.random() * 0.5 + 0.5) * cH)};
            var coor4 = {x: Math.floor( Math.random() * 0.5 * cW),
                        y: Math.floor((Math.random() * 0.5 + 0.5) * cH)};
            this.dotHistory[0] = coor1;
            this.dotHistory[1] = coor2;
            this.dotHistory[2] = coor3;
            this.dotHistory[3] = coor4;
            this.drawTriangleDir(coor1.x, coor1.y, 50, this.getAngleBetweenPoints(coor1.x, coor1.y, coor2.x, coor2.y), color, width, true);
        } else {            
            var prev = this.state - 1;
            var curr = this.state % 4;
            var next = (this.state + 1) % 4;
            if (this.state < 5) {
                this.drawLine(this.dotHistory[prev].x, this.dotHistory[prev].y, 
                              this.dotHistory[curr].x, this.dotHistory[curr].y, color, width);
                this.drawTriangleDir(this.dotHistory[curr].x, this.dotHistory[curr].y, 50, 
                    this.getAngleBetweenPoints(this.dotHistory[curr].x, this.dotHistory[curr].y, 
                                               this.dotHistory[next].x, this.dotHistory[next].y), color, width, true);
            }
        }
        if (this.state == 4) {
            this.ctx.beginPath();
            this.ctx.moveTo(0,0);
            this.ctx.lineTo(this.imageLayer.clientWidth, 0);
            this.ctx.lineTo(this.imageLayer.clientWidth, this.imageLayer.clientHeight);
            this.ctx.lineTo(0, this.imageLayer.clientHeight);
            this.ctx.moveTo(this.dotHistory[0].x, this.dotHistory[0].y);
            this.ctx.lineTo(this.dotHistory[1].x, this.dotHistory[1].y);
            this.ctx.lineTo(this.dotHistory[2].x, this.dotHistory[2].y);
            this.ctx.lineTo(this.dotHistory[3].x, this.dotHistory[3].y);
            this.ctx.closePath();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fill('evenodd');
            this.state = -1;
        }
    }
    triggerLines() {
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
        if (fill) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }
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
            points[0].x, points[0].y,
            points[1].x, points[1].y,
            points[2].x, points[2].y,
            color, width, fill
        );
    }
    drawLineDir(x, y, length, angle, color = 'black', width = 1, blockable = true, stepLength = 4) {
        var x2 = x + length * Math.cos(angle);
        var y2 = y + length * Math.sin(angle);
        if (blockable) {
            var firstHit = true;
            for (let i = 0; i < length; i+= stepLength) {
                x2 = x + i * Math.cos(angle);
                y2 = y + i * Math.sin(angle);
                if (this.getPxData({x: x2, y: y2})[0] == 0) {
                    
                } else {
                    if (!firstHit) break;
                    firstHit = false;
                }
            }
        }
        this.drawLine(x, y, x2, y2, color, width);
        return {x:x2,y:y2};
    }
    deg2rad(degrees) {
        return degrees * (Math.PI / 180);
    }
    getAngleBetweenPoints(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }
    clearState() {
        this.state = null;
        this.effect = null;
    }
}