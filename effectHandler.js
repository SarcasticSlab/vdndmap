class EffectHandler {
	constructor(tokenHandler) {
        this.imageLayer = document.getElementById("image-layer");
        this.ctx = this.imageLayer.getContext("2d");
        this.ctx.willReadFrequently = true; // For performance optimization
		this.tokenHandler = tokenHandler;

        this.trigger = this.trigger.bind(this);
        this.clearEffects = this.clearEffects.bind(this);
        this.state = null;
        this.effect = null;
        this.listOfEffects = ['claws', 'growingDots', 'spikyTriangle','hexagons','lines', 'void', 'randomRoom', 'growthRoom'];
        this.dotHistory = {};
        this.voidLoops = 0;
        const patternFiles = ["brick-pattern.png", "forest-pattern.png", "grass-pattern.png", "grass-rock-pattern.png", "lava-pattern.png", "marmor-pattern.png", "magic-pattern.png", "magic-pattern-2.png", "sand-pattern.png", "stone-pattern.png", "stone-pattern-2.png", "water-pattern.png"];
        const effectFiles = ["energy-circle.png", "fire-circle.png"];
        this.groundImages = {};
        this.effectImages = {};
        patternFiles.forEach(file => {
        const name = file.replace(/\.[^/.]+$/, "");
        this.groundImages[name] = new Image();
        this.groundImages[name].src = "/patterns/" + file;
        });
        effectFiles.forEach(file => {
        const name = file.replace(/\.[^/.]+$/, "");
        this.effectImages[name] = new Image();
        this.effectImages[name].src = "/patterns/" + file;


        this.grid = {};
        this.gridSquareSize = 25;
        });
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
            this.drawRectangle(0, 0, this.imageLayer.clientWidth, this.imageLayer.clientHeight, 'black', 1, true);
            this.dotHistory = {}; // Reset dot history
            console.log("Triggering effect:", this.effect);
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
            } else if (this.effect == 'randomRoom') {
                this.state = 0;
                this.createRoom(this.state);
            } else if (this.effect == 'growthRoom') {
                this.state = 0;
                this.initializeGrid();
                this.setGridStartType('random');
                this.setGridGrowthType('random');
                this.growthRoom(this.state);
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
            if (this.state > 3 && Math.random() * 10 <= 4) this.clearState();
        } else if (this.effect == 'hexagons') {
            this.state++;
            this.createHexagon(hexagonLength, hexagonSideLength, 'red', this.state);
            if (this.state > 4 && Math.random() * 10 <= this.state) this.clearState();
        } else if (this.effect == 'lines') {
            this.state++;
            this.createLines('red', this.state, linesWidth, true, linesStepLength);
            if (this.state > 4 && Math.random() * 10 <= 5) this.clearState();
        } else if (this.effect == 'void') {
            this.state++;
            this.createVoid('darkgray', voidWidth);
            if (this.voidLoops > 5) {
                this.clearState();
            };
        } else if (this.effect == 'randomRoom') {
            this.state++;
            this.createRoom(this.state);
            if (this.state > 1) {
                this.clearState();
                this.isleCoors = [];
            }
        } else if (this.effect == 'growthRoom') {
            this.state++;
            this.growthRoom(this.state);
            if (this.state > 3) {
                this.clearState();
                this.growthRoomGrid = [];
                this.growthRoomGrowthPoints = [];
                this.growthRoomGroundType = null;
                this.growthRoomFloorPoints = [];
                this.grid['Growth_Type'] = null;
            }
        }
        return this.imageLayer;
    }
    initializeGrid() {
        var maxWidth = Math.round(this.imageLayer.clientWidth / this.gridSquareSize);
        var maxHeight = Math.round(this.imageLayer.clientHeight / this.gridSquareSize);
        
        for (let x = 0; x < maxWidth; x++) {
            for (let y = 0; y < maxHeight; y++) {
                this.grid[`${x},${y}`] = { type: 'void', x: x, y: y, isGrowth: false, isPointGrowth: false };
            }
        }
        this.grid['size'] = { width: maxWidth, height: maxHeight };
        this.grid['Growth_Types'] = ['Standard', 'PointExpansion', 'Removal'];
        this.grid['Start_Types'] = ['Standard', 'Corners', 'Seeds', 'Squares'];
        this.grid['Growth_Type'] = this.grid['Growth_Types'][Math.floor(Math.random() * this.grid['Growth_Types'].length)];
        this.grid['Start_Type'] = this.grid['Start_Types'][Math.floor(Math.random() * this.grid['Start_Types'].length)];
        this.grid['Std_Growth_Points'] = Math.floor(maxWidth * maxHeight / 5);
        this.grid['Std_Growth_Points_Removal'] = Math.floor(maxWidth * maxHeight / 2);
        this.grid['Add_Growth_Points'] = Math.floor(maxWidth * maxHeight / 20);
        this.grid['Rem_Growth_Points'] = Math.floor(maxWidth * maxHeight / 10);
        this.grid['Ground_Type'] = Object.keys(this.groundImages)[Math.floor(Math.random() * Object.keys(this.groundImages).length)];
    }
    getRandomGridPoint() {
        var startX = Math.floor(Math.random() * (this.grid['size'].width - 2)) + 1;
        var startY = Math.floor(Math.random() * (this.grid['size'].height - 2)) + 1;
        return {x: startX, y: startY};
    }
    getGridPointsOfType(type) {
        var fields = [];
        for (const key in this.grid) {
            if (this.grid[key].type == type) {
                fields.push(this.grid[key]);
            }
        }
        return fields;
    }
    getRandomGridPointOfGrowth(type = 'growth') {
        var points = [];
        if (type == 'growth') points = this.getGridPointsOfType('void').filter(pt => pt.isGrowth);
        else if (type == 'pointGrowth') points = this.getGridPointsOfType('void').filter(pt => pt.isPointGrowth);
        if (points.length > 0) {
            return points[Math.floor(Math.random() * points.length)];
        } else {
            return null;
        }
    }
    setGridGrowthType(type) {
        if (this.grid['Growth_Types'].includes(type)) {
            this.grid['Growth_Type'] = type;
        } else {
            this.grid['Growth_Type'] = this.grid['Growth_Types'][Math.floor(Math.random() * this.grid['Growth_Types'].length)];
        }
    }
    setGridStartType(type) {
        if (this.grid['Start_Types'].includes(type)) {
            this.grid['Start_Type'] = type;
        } else {
            this.grid['Start_Type'] = this.grid['Start_Types'][Math.floor(Math.random() * this.grid['Start_Types'].length)];
        }
    }
    setGridGroundType(type) {
        if (Object.keys(this.groundImages).includes(type)) {
            this.grid['Ground_Type'] = type;
        } else {
            this.grid['Ground_Type'] = Object.keys(this.groundImages)[Math.floor(Math.random() * Object.keys(this.groundImages).length)];
        }
    }
    setGridPoint(pt, type, isGrowth = false, isPointGrowth = false) {
        if (`${pt.x},${pt.y}` in this.grid) {
            this.grid[`${pt.x},${pt.y}`].type = type;
            this.grid[`${pt.x},${pt.y}`].isGrowth = isGrowth;
            this.grid[`${pt.x},${pt.y}`].isPointGrowth = isPointGrowth;
        }
    }
    setNeighborsToGrowth(pt, type = 'growth') {
        var neighbors = this.getNeighbors(pt.x, pt.y);
        for (const n of neighbors) {
            if (n.x > 0 && n.x < this.grid['size'].width && n.y > 0 && n.y < this.grid['size'].height && this.grid[`${n.x},${n.y}`].type == 'void') {
                this.grid[`${n.x},${n.y}`].isGrowth = true;
                if (type == 'pointGrowth') this.grid[`${n.x},${n.y}`].isPointGrowth = true;
            }
        }
    }
    downgradeNeighbors(pt) {
        var neighbors = this.getNeighbors(pt.x, pt.y);
        for (const n of neighbors) {
            if (n.x > 0 && n.x < this.grid['size'].width && n.y > 0 && n.y < this.grid['size'].height && this.grid[`${n.x},${n.y}`].type == 'Floor') {
                this.grid[`${n.x},${n.y}`].type = 'growth';
                this.grid[`${n.x},${n.y}`].isGrowth = true;
                this.grid[`${n.x},${n.y}`].isPointGrowth = false;
            }
        }
    }
    clearUpGridGrowthPoints() {
        for (const key in this.grid) {
            if (this.grid[key].type == 'void') {
                this.grid[key].isGrowth = false;
                this.grid[key].isPointGrowth = false;
            } else if (this.grid[key].type == 'growth') {
                this.grid[key].type = 'void';
                this.grid[key].isGrowth = false;
                this.grid[key].isPointGrowth = false;
            }
        }
        for (const key in this.grid) {
            if (this.grid[key].type == 'Floor') {
                this.setNeighborsToGrowth(this.grid[key], 'growth');
            }
        }
    }
    drawGrid() {
        for (let x = 0; x < this.grid['size'].width; x++) {
            for (let y = 0; y < this.grid['size'].height; y++) {
                if (this.grid[`${x},${y}`].type == 'Floor') {
                    this.drawRectangle(x * this.gridSquareSize, y * this.gridSquareSize, this.gridSquareSize, this.gridSquareSize, 'darkgray', 1, true, this.groundImages[this.grid['Ground_Type']]);
                } else if (this.grid[`${x},${y}`].type == 'void' && (this.grid[`${x},${y}`].isGrowth || this.grid[`${x},${y}`].isPointGrowth)) {
                    this.drawRectangle(x * this.gridSquareSize, y * this.gridSquareSize, this.gridSquareSize, this.gridSquareSize, '#111', 1, true);
                } else {
                    this.drawRectangle(x * this.gridSquareSize, y * this.gridSquareSize, this.gridSquareSize, this.gridSquareSize, 'black', 1, true);
                }
            }
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
            coor = this.drawLineDir(coor.x, coor.y, length, angle, color, 5, false);
            coor2 = this.drawLineDir(coor2.x, coor2.y, length, angle, color, 5, false);
            coor3 = this.drawLineDir(coor3.x, coor3.y, length, angle, color, 5, false);
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
                    var coor1 = this.drawLineDir(parseInt(key.split(',')[0]), parseInt(key.split(',')[1]), length, obj.angle, color, 5, false);
                    var coor2 = this.drawLineDir(parseInt(key.split(',')[0]), parseInt(key.split(',')[1]), length, obj.angle + 2 * Math.PI / 3, color, 5, false);
                    var coor3 = this.drawLineDir(parseInt(key.split(',')[0]), parseInt(key.split(',')[1]), length, obj.angle - 2 * Math.PI / 3, color, 5, false);
                    this.dotHistory[`${coor1.x},${coor1.y}`] = {angle: obj.angle + Math.PI, initial: false};
                    this.dotHistory[`${coor2.x},${coor2.y}`] = {angle: obj.angle + Math.PI + 2 * Math.PI / 3, initial: false};
                    this.dotHistory[`${coor3.x},${coor3.y}`] = {angle: obj.angle + Math.PI - 2 * Math.PI / 3, initial: false};
                } else {
                    var coor2 = this.drawLineDir(parseInt(key.split(',')[0]), parseInt(key.split(',')[1]), length, obj.angle + 2 * Math.PI / 3, color, 5, false);
                    var coor3 = this.drawLineDir(parseInt(key.split(',')[0]), parseInt(key.split(',')[1]), length, obj.angle - 2 * Math.PI / 3, color, 5, false);
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
            this.voidLoops++;
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
    drawLine(x1, y1, x2, y2, color = 'black', width = 1, innerColor = null, outerColor = null) {
        if (innerColor && outerColor) {
            // Outer stroke first (largest)
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.strokeStyle = outerColor;
            this.ctx.lineWidth = width * 0.75; // outer = width/4 + width/2
            this.ctx.stroke();
            this.ctx.closePath();

            // Inner stroke (on top, smaller)
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.strokeStyle = innerColor;
            this.ctx.lineWidth = width * 0.5; // inner = width/2
            this.ctx.stroke();
            this.ctx.closePath();
        } else {
            // Normal single-color line
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = width;
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }
    drawCircle(x, y, radius, color = 'black', width = 1, fill = false, image = null) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;

        if (fill) {
            if (image) {
                // Use an image pattern as fill
                const pattern = this.ctx.createPattern(image, "repeat"); // "repeat", "repeat-x", "repeat-y", or "no-repeat"
                this.ctx.fillStyle = pattern;
            } else {
                // Fallback: solid color
                this.ctx.fillStyle = color;
            }
            this.ctx.fill();
        } else {
            this.ctx.strokeStyle = color;
            this.ctx.stroke();
        }
    }
    drawSquare(x, y, size, color = 'black', width = 1, fill = false) {
        this.ctx.beginPath();
        this.ctx.rect(x-size/2, y-size/2, size, size);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        if (fill) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }
    }
    drawTriangle(x1, y1, x2, y2, x3, y3, color = 'black', width = 1, fill = false) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineTo(x3, y3);
        this.ctx.closePath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        if (fill) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }
    }
    drawRectangle(x, y, width, height, color = 'black', width2 = 1, fill = false, image = null) {
    this.ctx.beginPath();
    this.ctx.rect(x, y, width, height);
    this.ctx.lineWidth = width2;

        if (fill) {
            if (image) {
                // Use an image pattern as fill
                const pattern = this.ctx.createPattern(image, "repeat"); // "repeat", "repeat-x", "repeat-y", or "no-repeat"
                this.ctx.fillStyle = pattern;
            } else {
                // Fallback: solid color
                this.ctx.fillStyle = color;
            }
            this.ctx.fill();
        } else {
            this.ctx.strokeStyle = color;
            this.ctx.stroke();
        }
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
        this.dotHistory = {};
    }
    createRoom(state) {
        if (state == 0) {
            this.ctx.clearRect(0, 0, this.imageLayer.clientWidth, this.imageLayer.clientHeight);
            this.drawRectangle(0, 0, this.imageLayer.clientWidth, this.imageLayer.clientHeight, 'black', 1, true);
            var numOfRectangles = Math.floor(Math.random() * 6) + 3; // 5 to 15 isles
            var recentCoorOL = {x: 0, y: 0};
            var recentCoorDR = {x: this.imageLayer.clientWidth, y: this.imageLayer.clientHeight};
            var groundType = Object.keys(this.groundImages)[Math.floor(Math.random() * Object.keys(this.groundImages).length)];
            console.log(groundType);
            for (var i = 0; i < numOfRectangles; i++) {
                var coor1 = null;
                var coor2 = null;
                for (var attempt = 0; attempt < 100; attempt++) {
                    var coor1 = {x: Math.floor(Math.random() * (recentCoorDR.x - recentCoorOL.x) / 50 + recentCoorOL.x / 50) * 50,
                            y: Math.floor(Math.random() * (recentCoorDR.y - recentCoorOL.y) / 50 + recentCoorOL.y / 50) * 50};
                    var coor2 = {x: Math.floor(Math.random() * this.imageLayer.clientWidth / 50) * 50,
                            y: Math.floor(Math.random() * this.imageLayer.clientHeight / 50) * 50};
                    var xLength = Math.abs(coor2.x - coor1.x);
                    var yLength = Math.abs(coor2.y - coor1.y);
                    var area = xLength * yLength;
                    if (area > 50000) break;
                }
                var coorOL = {x: Math.min(coor1.x, coor2.x), y: Math.min(coor1.y, coor2.y)};
                var coorDR = {x: Math.max(coor1.x, coor2.x), y: Math.max(coor1.y, coor2.y)};
                recentCoorOL = coorOL;
                recentCoorDR = coorDR;
                this.drawRectangle(coorOL.x, coorOL.y, coorDR.x - coorOL.x + 50, coorDR.y - coorOL.y + 50, 'darkgray', 1, true, this.groundImages[groundType]);
                
            }
        }
        for (var obstacle = 0; obstacle < 3*state; obstacle++) {
            var coor = null;
            var coor2 = null;
            for (var attempt = 0; attempt < 100; attempt++) {
                coor = {x: Math.floor(Math.random() * this.imageLayer.clientWidth / 50) * 50,
                            y: Math.floor(Math.random() * this.imageLayer.clientHeight / 50) * 50};

                if (this.getPxData(coor)[0] != 0) {
                    break;
                }
            }
            for (var attempt = 0; attempt < 100; attempt++) {
                coor2 = {x: Math.floor(Math.random() * this.imageLayer.clientWidth / 50) * 50,
                            y: Math.floor(Math.random() * this.imageLayer.clientHeight / 50) * 50};
                if (this.getPxData(coor2)[0] != 0) {
                    break;
                }
            }
            var lineColor = 'white';
            if (state == 1) lineColor = 'lightgray';
            if (state == 2) lineColor = 'gray';
            if (state >= 3) lineColor = 'darkgray';
            this.drawLine(coor.x, coor.y, coor2.x, coor2.y, 'black', 10, lineColor, 'black');
        }
        for (var obstacle = 0; obstacle < 2*state + 2; obstacle++) {
            var coor = null;
            for (var attempt = 0; attempt < 100; attempt++) {
                coor = {x: Math.floor(Math.random() * this.imageLayer.clientWidth / 50) * 50,
                            y: Math.floor(Math.random() * this.imageLayer.clientHeight / 50) * 50};
                if (this.getPxData(coor)[0] != 0) {
                    break;
                }
            }
            var effectType = Object.keys(this.effectImages)[Math.floor(Math.random() * Object.keys(this.effectImages).length)];
            this.drawCircle(coor.x, coor.y, 30, 'red', 5, true, this.effectImages[effectType]);
        }
    }
    growthRoom(state) {
        var remainingGrowthPoints = this.grid['Std_Growth_Points'];
        //console.log(`Growth Room State: ${state}, Growth Type: ${this.grid['Growth_Type']}, Start Type: ${this.grid['Start_Type']}`);
        if (state == 0) {
            if (this.grid['Growth_Type'] == 'Removal') remainingGrowthPoints = this.grid['Std_Growth_Points_Removal'];
            var startPt;
            if (this.grid['Start_Type'] == 'Standard') {
                startPt = this.getRandomGridPoint();
                this.setGridPoint(startPt, 'Floor', false);
                this.setNeighborsToGrowth(startPt);
            } else if (this.grid['Start_Type'] == 'Corners') {
                for (var corner = 0; corner < 4; corner++) {
                    if (corner == 0) startPt = {x: 1, y: 1};
                    else if (corner == 1) startPt = {x: this.grid['size'].width - 2, y: 1};
                    else if (corner == 2) startPt = {x: this.grid['size'].width - 2, y: this.grid['size'].height - 2};
                    else if (corner == 3) startPt = {x: 1, y: this.grid['size'].height - 2};
                    this.setGridPoint(startPt, 'Floor', false);
                    this.setNeighborsToGrowth(startPt);
                }
            } else if (this.grid['Start_Type'] == 'Center') {
                startPt = {x: Math.floor(this.grid['size'].width / 2), y: Math.floor(this.grid['size'].height / 2)};
                this.setGridPoint(startPt, 'Floor', false);
                this.setNeighborsToGrowth(startPt);
            } else if (this.grid['Start_Type'] == 'Seeds') {
                var squareSize = Math.floor(Math.min(this.grid['size'].width, this.grid['size'].height) / 5);
                var squares = Math.floor(Math.random() * 3) + 3; 
                for (var x = 1; x < this.grid['size'].width; x += squareSize) {
                    for (var y = 1; y < this.grid['size'].height; y += squareSize) {
                        startPt = {x: x, y: y};
                        this.setGridPoint(startPt, 'Floor', false);
                        this.setNeighborsToGrowth(startPt);
                    }
                }
            } else if (this.grid['Start_Type'] == 'Squares') {
                var sizeFactor = (this.grid['Growth_Type'] == 'Removal') ? 2 : 1;
                var squareFactor = (this.grid['Growth_Type'] == 'Removal') ? 3 : 1;
                var squareSize = Math.floor(Math.min(this.grid['size'].width, this.grid['size'].height) / 5) * sizeFactor;
                var squares = (Math.floor(Math.random() * 3) + 2) * squareFactor; // 2 to 4 squares, more for removal
                for (var i = 0; i < squares; i++) {
                    startPt = {x: Math.floor(Math.random() * (this.grid['size'].width - squareSize - 2)) + 1,
                               y: Math.floor(Math.random() * (this.grid['size'].height - squareSize - 2)) + 1};
                    for (var x = startPt.x; x < startPt.x + squareSize; x++) {
                        for (var y = startPt.y; y < startPt.y + squareSize; y++) {
                            this.setGridPoint({x: x, y: y}, 'Floor', false);
                            this.setNeighborsToGrowth({x: x, y: y});
                        }
                    }
                }
                remainingGrowthPoints = 0;
            }
            for (var i=0; i < remainingGrowthPoints; i++) {
                var growthPoint = this.getRandomGridPointOfGrowth();
                this.setGridPoint(growthPoint, 'Floor', false);
                this.setNeighborsToGrowth(growthPoint);
            }
            this.setGridGroundType('random');
        } else {
            remainingGrowthPoints = this.grid['Add_Growth_Points'];
            for (var i = 0; i < remainingGrowthPoints; i++) {
                if (this.grid['Growth_Type'] == 'Standard') {
                    var growthPoint = this.getRandomGridPointOfGrowth();
                    this.setGridPoint(growthPoint, 'Floor', false);
                    this.setNeighborsToGrowth(growthPoint);
                } else if (this.grid['Growth_Type'] == 'PointExpansion') {
                    if (this.getRandomGridPointOfGrowth('pointGrowth') == null) {
                        var growthPoint = this.getRandomGridPointOfGrowth();
                        this.setGridPoint(growthPoint, 'Floor', false, false);
                        this.setNeighborsToGrowth(growthPoint, 'pointGrowth');
                    }
                    
                    var growthPoint = this.getRandomGridPointOfGrowth('pointGrowth');
                    if (growthPoint) {
                        this.setGridPoint(growthPoint, 'Floor', false, false);
                        this.setNeighborsToGrowth(growthPoint, 'pointGrowth');
                    }
                } else if (this.grid['Growth_Type'] == 'Removal') {
                    var removalPoint = this.getRandomGridPointOfGrowth();

                    if (!removalPoint) {
                        continue;
                    }
                    this.setGridPoint(removalPoint, 'void', false, false);
                    this.downgradeNeighbors(removalPoint);
                    this.clearUpGridGrowthPoints();
                }
            }
        }

        // Draw the grid
        this.drawGrid();
    }
    getNeighbors(x,y) {
        return [{ x: x + 1, y: y },
                { x: x - 1, y: y },
                { x: x, y: y + 1 },
                { x: x, y: y - 1 }];
    }
    getDistance(x1, y1, x2, y2) {
        return {xDist: Math.abs(x2 - x1), yDist: Math.abs(y2 - y1), dist: Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)};
    }
    clearEffects() {
        this.ctx.clearRect(0, 0, this.imageLayer.clientWidth, this.imageLayer.clientHeight);
        this.drawRectangle(0, 0, this.imageLayer.clientWidth, this.imageLayer.clientHeight, 'black', 1, true);
        this.clearState();
        return this.imageLayer;
    }
    uploadImage(imageSrc) {
        if (!this.imageLayer) return;

        const ctx = this.imageLayer.getContext("2d");
        const img = new Image();

        img.onload = () => {
            // Clear old content
            ctx.clearRect(0, 0, this.imageLayer.width, this.imageLayer.height);
            // Draw new image
            ctx.drawImage(img, 0, 0, this.imageLayer.width, this.imageLayer.height);
        };

        img.src = imageSrc;
    }
}