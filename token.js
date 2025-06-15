class Token {
	constructor(id,x,y,color,rot,size,scale, image) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.color = color;
		this.rot = rot;
		this.size = size;
		this.scale = scale;
		this.globalScale = 1;
		this.length = size*scale;
		this.centerX = x+Math.round(this.length/2);
		this.centerY = y+Math.round(this.length/2);
		this.tokenText = null;
		this.image = new Image();
		this.image.src = image;
		//console.log(id,x,y,color,rot,size,scale);
	}
	updateCoors(coors) {
		this.centerX = Math.round(coors.x);
		this.centerY = Math.round(coors.y);
		this.x = this.centerX - Math.round(this.length/2);
		this.y = this.centerY - Math.round(this.length/2);
	}
	updateGlobalScale(scale) {
		this.globalScale = scale;
		this.updateScale(this.scale);
	}
	updateScale(scale) {
		this.x = this.x - Math.round((scale*this.globalScale-this.scale*this.globalScale) * this.size / 2);
		this.y = this.y - Math.round((scale*this.globalScale-this.scale*this.globalScale) * this.size / 2);
		this.scale = scale;
		this.length = this.size*scale*this.globalScale;
		this.centerX = this.x+Math.round(this.length/2);
		this.centerY = this.y+Math.round(this.length/2);
	}
	updateRot(rot) {
		this.rot = rot;
	}
	update(data) {
		this.id = data.id;
		this.x = Math.round(data.x);
		this.y = Math.round(data.y);
		this.rot = data.rot;
		this.scale = data.scale;
		this.tokenText = data.text;
		this.color = data.color;
		this.size = data.size;
		this.length = data.length;
		this.centerX = Math.round(data.centerX);
		this.centerY = Math.round(data.centerY);
		this.image.src = data.image;
	}
	getCoors() {
		return {x: this.centerX, y: this.centerY};
	}
	log() {
		console.log("Obj-" + this.id,this.id,this.x,this.y,this.color,this.rot,this.size,this.scale,this.length);
	}
}

class TokenHandler {
	constructor() {
		this.imageLayer = document.getElementById("image-layer");
		this.imageLayerCTX = this.imageLayer.getContext("2d");
		this.gridLayer = document.getElementById("grid-layer");
		this.gridLayerCTX = this.gridLayer.getContext("2d");
		this.tokenLayer = document.getElementById("token-layer");
		this.tokenLayerCTX = this.tokenLayer.getContext("2d");
		this.menuLayer = document.getElementById("menu-layer");
		this.menuLayerCTX = this.menuLayer.getContext("2d");
		this.menuLeftScaleCoors = null;
		this.menuRightScaleCoors = null;
		this.menuRotateCoors = null;
		this.tokens = {};
		this.menu = false;
		this.menuId = null;
		this.offsetX = 0;
		this.offsetY = 0;
		this.scale = 1;
		this.isScaling = false;
		this.isRotating = false;
		
		this.isRecentLeftDown = false;
		this.isRecentRightDown = false;
		this.isLeftDown = false;
		this.isRightDown = false;
		this.menuTargetRot = 0;
		this.lastMouseCoors = { x: null, y: null};

		this.gridSize = 25;
		this.isLogReducingOn = true;
		this.isManipulationAllowed = true;
		// Preload the UI Elements
		this.rotateIcon = new Image();
		this.rotateIcon.src = "./icons/RotateIcon.png";
		this.iconRadius = 20;
		this.scaleLeftIcon = new Image();
		this.scaleLeftIcon.src = "./icons/ScaleLeftIcon.png";
		this.scaleRightIcon = new Image();
		this.scaleRightIcon.src = "./icons/ScaleRightIcon.png";
		this.resetIcon = new Image();
		this.resetIcon.src = "./icons/ResetIcon.png";

		this.createToken = this.createToken.bind(this);
		this.scaleToggle = this.scaleToggle.bind(this);
		this.drawSquareGrid = this.drawSquareGrid.bind(this);
		this.drawHexGrid = this.drawHexGrid.bind(this);
		this.setPixelsForField = this.setPixelsForField.bind(this);
		

		this.isDebugOutputActivated = false;
		this.init();
	}
	
	init() {
		this.scaleToBackgroundImage();
		document.addEventListener('click', (e) => {
			e.stopPropagation();
			const rect = this.menuLayer.getBoundingClientRect();
			const x = (e.clientX - rect.left) / this.scale;
			const y = (e.clientY - rect.top) / this.scale;

			if (!this.menu) {
				this.checkClickForToken(x,y);
				return;
			} else {
				this.checkClickForToken(x,y);
			}
		});
		
		window.addEventListener('resize', () => {
			this.setupInitialView();
		});

	}
	
	createToken(e) {
		this.debugLog("createToken");
		var id = Date.now();
		this.tokens[id] = new Token(id,725,575, this.getRandomColor(), 0, 80,1, uploadedImages[selectedImageId].src);
		
		this.drawTokens();
	}
	
	deleteToken(id = null) {
		this.debugLog("deleteToken");
		if (id) delete this.tokens[id];
		else delete this.tokens[this.menuId];
		var tokenId = this.menuId;
		this.clearMenu();
		this.drawTokens();
		return tokenId;
	}

	scaleToggle(e) {
		console.log(this.isManipulationAllowed, " >>", e.target.checked);
		this.isManipulationAllowed = e.target.checked;
	}

	updateToken(data) {
		this.debugLog("updateToken");
		//console.log("Received", data);
		console.log(data);
		if(this.tokens[data.id]) {
			this.tokens[data.id].update(data);
		} else {
			this.tokens[data.id] = new Token(data.id, data.x, data.y, data.color, data.rot, data.size, data.scale, data.image);
		}
		this.drawTokens();
	}

	setupInitialView() {
		// Berechne initiale Skalierung, damit das Bild ins Fenster passt
		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;
		
		const scaleX = windowWidth / this.imageWidth;
		const scaleY = windowHeight / this.imageHeight;
		this.scale = Math.min(scaleX, scaleY);
		
		// Zentriere das Bild
		this.offsetX = (windowWidth - this.imageWidth * this.scale) / 2;
		this.offsetY = (windowHeight - this.imageHeight * this.scale) / 2;
		
		this.updateImageTransform();
		this.tokenHandlerElement.setOffsetForTokens(this.offsetX, this.offsetY, this.scale);
	}
	
	handleLeftMouse(dir) {
		if (this.isDebugOutputActivated) console.log(">> Left", dir);
		if (dir == "UP") this.isLeftDown = false;
		else this.isLeftDown = true;
	}

	handleRightMouse(dir) {
		if (this.isDebugOutputActivated) console.log(">> Right", dir);
		if (dir == "UP") this.isRightDown = false;
		else this.isRightDown = true;
	}

	onMouseMove(coors) {
		var isTokenChanged = false;
		if (this.isDebugOutputActivated) console.log("Left ", this.isLeftDown, this.isRecentLeftDown);


		if (this.isRightDown) this.clearMenu();
		if (!this.isLeftDown && this.isRecentLeftDown) {
			this.isRotating = false;
			this.isScaling = false;
		}
		if (this.menu) {
			var target = this.isMenuClose(coors);
			document.body.style.cursor = target;
			if (!this.isRecentLeftDown && target == 'col-resize') this.isScaling = true;
			else if (!this.isRecentLeftDown && target == 'grabbing') this.isRotating = true;
			else if (!this.isLeftDown) {
				this.isScaling = false;
				this.isRotating = false;
				this.menuTargetRot = 0;
			}
			if (this.isRecentLeftDown && this.isLeftDown) {
				if (this.isRotating && this.isManipulationAllowed) {
					if (this.menuTargetRot == 0) this.menuTargetRot = this.tokens[this.menuId].rot;

					var spaceX = this.tokens[this.menuId].centerX - coors.x;
					var spaceY = this.tokens[this.menuId].centerY - coors.y;
					var angle = this.menuTargetRot + Math.atan2(spaceY, spaceX)*180/Math.PI-90;

					this.tokens[this.menuId].updateRot(angle);
					isTokenChanged = true;
				} else if (this.isScaling && this.isManipulationAllowed) {
					var space = Math.abs(this.tokens[this.menuId].centerX - coors.x);
					var scale = 2 * space / this.tokens[this.menuId].size;
					this.tokens[this.menuId].updateScale(scale);
					isTokenChanged = true;
				} else {
					var mouseToTarget = this.getDistance(coors,this.tokens[this.menuId].getCoors());
					if (mouseToTarget <  this.gridSize * this.tokens[this.menuId].length * 10) {
						this.tokens[this.menuId].updateCoors(coors)
						isTokenChanged = true;
					}
				}
				this.drawTokens();
				this.drawMenu();
			}
		}
		this.lastMouseCoors = coors;

		this.isRecentLeftDown = this.isLeftDown;
		this.isRecentRightDown = this.isRightDown;
		if (isTokenChanged)
			return this.tokens[this.menuId];
		else return false;
	}
	
	drawTestGrid() {
		var offset = 100;
		var margin = 15;
		this.imageLayerCTX.beginPath(); // Start a new path
		this.tokenLayerCTX.beginPath(); // Start a new path
		this.menuLayerCTX.beginPath(); // Start a new path
		for (var x = offset;x<this.imageLayer.clientWidth;x+=offset) {
			for (var y = offset;y<this.imageLayer.clientHeight;y+=offset) {
				this.imageLayerCTX.moveTo(0,y);
				this.imageLayerCTX.lineTo(this.imageLayer.clientWidth, y);
				this.imageLayerCTX.moveTo(x,0);
				this.imageLayerCTX.lineTo(x, this.imageLayer.clientHeight);
				this.tokenLayerCTX.moveTo(0,y+margin);
				this.tokenLayerCTX.lineTo(this.tokenLayer.clientWidth, y+margin);
				this.tokenLayerCTX.moveTo(x+margin,0);
				this.tokenLayerCTX.lineTo(x+margin, this.tokenLayer.clientHeight);
				this.menuLayerCTX.moveTo(0,y-margin);
				this.menuLayerCTX.lineTo(this.menuLayer.clientWidth, y-margin);
				this.menuLayerCTX.moveTo(x-margin,0);
				this.menuLayerCTX.lineTo(x-margin, this.menuLayer.clientHeight);
			}
		}
		this.imageLayerCTX.stroke();
		this.tokenLayerCTX.stroke();
		this.menuLayerCTX.stroke();
	}
	
	createTestTokens(num) {
		for (var i=0;i<num;i++) {
			//let tempToken = new Token(i,Math.floor(Math.random()*700),Math.floor(Math.random()*500), this.getRandomColor(), Math.floor(Math.random()*360), Math.floor(Math.random()*40+80),1);
			let tempToken = new Token(i,i*150,i*150, this.getRandomColor(), 45, 150,1, null);
			this.tokens[i] = tempToken;
		}
	}
	
	setOffsetForTokens(offsetX,offsetY,scale) {
		this.debugLog("setOffsetForTokens");
		this.scale = scale;
		this.offsetX = offsetX;
		this.offsetY = offsetY;
		if (this.isDebugOutputActivated) console.log("OffsetX:",offsetX,"OffsetY:",offsetY,"Scale:",scale);
		this.updateImageTransform();	
	}
	
	updateImageTransform() {
		this.debugLog("updateImageTransformawTokens");
		if (this.tokenLayer) {
			this.tokenLayer.style.transform = 
				`translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
		}
		if (this.menuLayer) {
			this.menuLayer.style.transform = 
				`translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
		}
		if (this.gridLayer) {
			this.gridLayer.style.transform = 
				`translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
		}
		if (this.imageLayer) {
			this.imageLayer.style.transform = 
				`translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
		}
	}
	
	drawTokens() {
		if (!this.isLogReducingOn) this.debugLog("DrawTokens");
		this.imageLayerCTX.clearRect(0, 0, this.tokenLayer.clientWidth, this.tokenLayer.clientHeight); // clear previous
		Object.values(this.tokens).forEach((token) => {
			this.imageLayerCTX.save();
			const angleInRadians = token.rot * Math.PI / 180;
			this.imageLayerCTX.translate(token.centerX, token.centerY);
			this.imageLayerCTX.rotate(angleInRadians);
			
			const drawSize = token.length;
			if (token.image) {
				this.imageLayerCTX.drawImage(
					token.image,
					-drawSize / 2,
					-drawSize / 2,
					drawSize,
					drawSize
				);
			} else {
				this.imageLayerCTX.fillStyle = token.color;
				this.imageLayerCTX.fillRect(token.x-token.centerX,token.y-token.centerY,token.length,token.length);
			}
			/*this.imageLayerCTX.font = Math.max(20*token.scale,20) + 'px sans-serif';
			this.imageLayerCTX.fillStyle = "#fff";
			this.imageLayerCTX.textAlign = "center";      // Horizontal centering
			this.imageLayerCTX.textBaseline = "bottom";   // Vertical centering
			this.imageLayerCTX.fillText(token.id, 0, -token.length/2);
			this.imageLayerCTX.rotate(90 * Math.PI / 180);
			this.imageLayerCTX.fillText(token.id, 0, -token.length/2);
			this.imageLayerCTX.rotate(90 * Math.PI / 180);
			this.imageLayerCTX.fillText(token.id, 0, -token.length/2);
			this.imageLayerCTX.rotate(90 * Math.PI / 180);
			this.imageLayerCTX.fillText(token.id, 0, -token.length/2);*/
			this.imageLayerCTX.restore();
		});
	}
	
	checkClickForToken(x,y) {
		if (!this.isLogReducingOn) this.debugLog("checkClickForToken");
		let temp = this;
		let isToken = Object.values(this.tokens).some(function(token) {
			if (temp.isClose(x, y, token)) {
				temp.drawMenu(token);
				return true;
			}
		});
		if (!isToken) this.clearMenu();
	}
	
	drawMenu(token = this.tokens[this.menuId]) {
		if (!this.isLogReducingOn) this.debugLog("drawMenu");
		this.menuLayerCTX.clearRect(0, 0, this.imageLayer.clientWidth, this.imageLayer.clientHeight); // clear previous
		this.menuLayerCTX.fillStyle = "#003300";
		this.menuLayerCTX.font = '40px sans-serif';

		this.menuRotateCoors =     { x: token.centerX-this.iconRadius/2, y: token.y-this.iconRadius/2 };
		this.menuRightScaleCoors = { x: token.centerX+token.length/2-this.iconRadius/2, y: token.centerY-this.iconRadius/2 };
		this.menuLeftScaleCoors =  { x: token.x-this.iconRadius/2, y: token.centerY-this.iconRadius/2 };
		this.menuLayerCTX.drawImage(this.scaleRightIcon, token.centerX+token.length/2-this.iconRadius, token.centerY-this.iconRadius);
		this.menuLayerCTX.drawImage(this.scaleLeftIcon, token.x-this.iconRadius, token.centerY-this.iconRadius);
		this.menuLayerCTX.drawImage(this.rotateIcon, token.centerX-this.iconRadius, token.y-this.iconRadius);
		this.menu = true;
		this.menuId = token.id;
	}
	
	clearMenu() {
		if (!this.isLogReducingOn) this.debugLog("clearMenu");
		this.menuLayerCTX.clearRect(0, 0, this.imageLayer.clientWidth, this.imageLayer.clientHeight); // clear previous
		this.menuId = null;
		this.menu = false;
	}
	
	drawSquareGrid(e, gridSize = this.gridSize) {
		console.log("drawSquareGrid");
		if (e.target.checked) {
			document.getElementById("hexGrid").checked = false;
			const ctx = this.gridLayerCTX;
			const width = this.imageLayer.clientWidth;
			const height = this.imageLayer.clientHeight;

			ctx.clearRect(0, 0, width, height);
			ctx.strokeStyle = '#ccc5';
			ctx.lineWidth = 1;

			console.log(width,height, gridSize);
			for (let x = 0; x <= width; x += gridSize) {
				ctx.beginPath();
				ctx.moveTo(x, 0);
				ctx.lineTo(x, height);
				ctx.stroke();
			}

			for (let y = 0; y <= height; y += gridSize) {
				ctx.beginPath();
				ctx.moveTo(0, y);
				ctx.lineTo(width, y);
				ctx.stroke();
			}
		} else {
			this.gridLayerCTX.clearRect(0, 0, this.imageLayer.clientWidth, this.imageLayer.clientHeight); // clear previous
		}
	}

	drawHexGrid(e, gridSize = this.gridSize) {
		console.log("drawHexGrid");
		if (e.target.checked) {
			document.getElementById("squareGrid").checked = false;
			const ctx = this.gridLayerCTX;
			const width = this.imageLayer.clientWidth;
			const height = this.imageLayer.clientHeight;

			const hexWidth = gridSize+4;
			const hexHeight = Math.sqrt(3) / 2 * hexWidth;
			const horizSpacing = hexWidth * 0.75;
			const vertSpacing = hexHeight;

			ctx.clearRect(0, 0, width, height);
			ctx.strokeStyle = '#ccc5';
			ctx.lineWidth = 1;

			for (let y = 0; y < height + hexHeight; y += vertSpacing) {
				let row = Math.floor(y / vertSpacing);
				for (let x = 0; x < width + hexWidth; x += horizSpacing) {
					let col = Math.floor(x / horizSpacing);
					let offsetY = (col % 2) * (hexHeight / 2);
					this.drawHex(ctx, x, y+offsetY, hexWidth);
				}
			}
		} else {
			this.gridLayerCTX.clearRect(0, 0, this.imageLayer.clientWidth, this.imageLayer.clientHeight); // clear previous
		}
	}

	drawHex(ctx, x, y, size) {
		const r = size / 2;
		const h = Math.sqrt(3) * r;
		const points = [];

		for (let i = 0; i < 6; i++) {
			const angle = Math.PI / 180 * (60 * i);
			points.push({
				x: x + r * Math.cos(angle),
				y: y + r * Math.sin(angle)
			});
		}

		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);
		for (let i = 1; i < points.length; i++) {
			ctx.lineTo(points[i].x, points[i].y);
		}
		ctx.closePath();
		ctx.stroke();
	}

	isClose(x,y,token) {
		if ((x-token.centerX)*(x-token.centerX)+(y-token.centerY)*(y-token.centerY) < token.length*token.length) return true;
		else return false;
	}
	
	isMenuClose(coors) {
		if (this.getDistance(coors,this.menuLeftScaleCoors) < this.iconRadius*this.iconRadius) {
			return "col-resize";
		} else if (this.getDistance(coors,this.menuRightScaleCoors) < this.iconRadius*this.iconRadius) {;
			return "col-resize";
		} else if (this.getDistance(coors,this.menuRotateCoors) < this.iconRadius*this.iconRadius) {
			return "grabbing";
		}
		return "crosshair";
	}
	
	getDistance(coorsA, coorsB) {
		return (coorsA.x-coorsB.x)*(coorsA.x-coorsB.x)+(coorsA.y-coorsB.y)*(coorsA.y-coorsB.y);
	}
	
	setPixelsForField(px) {
		this.gridSize = px;
	}

	getRandomColor() {
	  var letters = '0123456789ABCDEF';
	  var color = '#';
	  for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	  }
	  return color;
	}

	debugLog(str) {
		console.log(str);
	}

	scaleToBackgroundImage() {
		const img = new Image();
		img.src = getComputedStyle(this.imageLayer).backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');

		img.onload = () => {
			const imgWidth = img.naturalWidth;
			const imgHeight = img.naturalHeight;

			const layers = [
				document.getElementById("image-layer"),
				document.getElementById("grid-layer"),
				document.getElementById("token-layer"),
				document.getElementById("menu-layer")
			];

			const canvas = layers[0];
			const canvasWidth = canvas.width;
			const canvasHeight = canvas.height;

			const imageRatio = imgWidth / imgHeight;
			const canvasRatio = canvasWidth / canvasHeight;

			if (Math.abs(canvasRatio - imageRatio) < 0.01) {
				console.log("Aspect ratios match, no resizing needed.");
			} else if (canvasRatio > imageRatio) {
				// Canvas is too wide, reduce width
				const newWidth = canvasHeight * imageRatio;
				layers.forEach(layer => layer.width = newWidth);
				console.log("Adjusted canvas width to:", newWidth);
			} else {
				// Canvas is too tall, reduce height
				const newHeight = canvasWidth / imageRatio;
				layers.forEach(layer => layer.height = newHeight);
				console.log("Adjusted canvas height to:", newHeight);
			}
		};
	}

}