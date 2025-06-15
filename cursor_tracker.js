// WICHTIG: Ändere diese URL zu deiner Server-IP
const SERVER_URL = 'ws://192.168.2.223:3000';

class CursorTracker {
	constructor(username) {
		// Scales, Rotates, Manages all Tokens
		this.tokenHandlerElement = new TokenHandler();;
		
		// Cursor Tracker objects
		this.ws = null;
		this.cursors = new Map();
		this.username = username;
		this.userId = this.generateUserId();
		this.isRightMouseDown = false;
		this.isMiddleMouseDown = false;
		this.isLeftMouseDown = false;
		this.rightClickStart = null;
		this.middleClickStart = null;
		this.leftClickStart = null;
		this.distanceLine = [];
		this.distanceLabel = [];
		this.isConnected = false;
		this.measurePoints = [];
		
		// Viewport und Koordinaten-System
		this.imageWidth = 1920;
		this.imageHeight = 1080;
		this.scale = 1;
		this.offsetX = 0;
		this.offsetY = 0;
		this.imageLayer = null;
		
		// Toggle stuff
		this.fadeOutToggle = "measure-fade-off";
		this.fadeOut = this.fadeOut.bind(this); // ✅ bind once here

		this.pixelsForField = 30;
		this.init();
	}
	
	generateUserId() {
		return 'user_' + Math.random().toString(36).substr(2, 9);
	}

	init() {
		this.imageLayer = document.getElementById('image-layer');
		this.setupInitialView();
		this.setupWebSocket();
		this.setupEventListeners();
		
		// Token Handler stuff
		//this.tokenHandlerElement.drawTestGrid();
		//this.tokenHandlerElement.createTestTokens(4);
		this.tokenHandlerElement.drawTokens();
		this.tokenHandlerElement.setPixelsForField(this.pixelsForField);
		document.getElementById("newToken").addEventListener("click", this.tokenHandlerElement.createToken);
		document.getElementById("scaleToggle").addEventListener("click", this.tokenHandlerElement.scaleToggle);
		document.getElementById("squareGrid").addEventListener("click", this.tokenHandlerElement.drawSquareGrid);
		document.getElementById("hexGrid").addEventListener("click", this.tokenHandlerElement.drawHexGrid);
		document.getElementById("fadeOut").addEventListener("click", this.fadeOut);
	}

	fadeOut(e) {
		if (e.target.checked) this.fadeOutToggle = "measure-fade";
		else this.fadeOutToggle = "measure-fade-off";
	}

	getOffsetInfo() {
		return this.offsetX, this.offsetY;
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

	setupWebSocket() {
		try {
			this.ws = new WebSocket(SERVER_URL);
			
			this.ws.onopen = () => {
				this.isConnected = true;
				this.updateStatus(`Connected as ${this.username}`);
				console.log('WebSocket connected');
			};

			this.ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					this.handleServerMessage(data);
				} catch (error) {
					console.error('Error during parsing of message:', error);
				}
			};

			this.ws.onclose = () => {
				this.isConnected = false;
				this.updateStatus('Connection failed - Trying Reconnect...');
				console.log('WebSocket disconnected');
				
				// Versuche Reconnect nach 3 Sekunden
				setTimeout(() => {
					this.setupWebSocket();
				}, 3000);
			};

			this.ws.onerror = (error) => {
				console.error('WebSocket Error:', error);
				this.updateStatus('Connectionerror - Check Server');
			};

		} catch (error) {
			console.error('Error during creation of WebSocket-Connection:', error);
			this.updateStatus('Cannot connect - Server not yet running?');
		}
	}

	handleServerMessage(data) {
		if (data.type === 'cursor_update' && data.userId !== this.userId) {
			// Cursor von anderem User
			if (!this.cursors.has(data.userId)) {
				this.createCursor(data.userId, data.name || 'Unbekannt', this.getRandomColor());
			}
			this.updateCursorPosition(data.userId, data.x, data.y);
		} else if (data.type === 'user_disconnect') {
			// User hat disconnected
			this.removeCursor(data.userId);
		} else if (data.type === 'token_update' && data.userId !== this.userId) {
			this.tokenHandlerElement.updateToken(data);
			this.tokenHandlerElement.drawTokens();
		} else if (data.type === 'token_del' && data.userId !== this.userId) {
			this.tokenHandlerElement.deleteToken(data.id);
			this.tokenHandlerElement.drawTokens();
		}
	}

	setupEventListeners() {
		const throttledMouseMove = (function(func, limit) {
			let lastCall = 0;
			return function(...args) {
				const now = Date.now();
				if (now - lastCall >= limit) {
					lastCall = now;
					func.apply(this, args);
				}
			};
		})(this.handleMouseMove.bind(this), 40);
		document.addEventListener('mousemove', throttledMouseMove);

		document.addEventListener('mousedown', (e) => {
			if (e.button === 2) { // Rechtsklick
				this.handleRightMouseDown(e);
			} else if (e.button === 1) { // Mittlere Maustaste
				this.handleMiddleMouseDown(e);
				e.preventDefault();
			} else if (e.button === 0) { // Linke Maustaste
				this.handleLeftMouseDown(e);
			}
		});

		document.addEventListener('mouseup', (e) => {
			if (e.button === 2) { // Rechtsklick
				this.handleRightMouseUp(e);
			} else if (e.button === 1) { // Mittlere Maustaste
				this.handleMiddleMouseUp(e);
			} else if (e.button === 0) { // Left Maustaste
				this.handleLeftMouseUp(e);
			}
		});

		document.addEventListener('keydown', (event) => {
			if (event.key === 'Delete') {
				this.handleDelete();
			}
		});

		document.addEventListener(
			'wheel',
			(e) => {
				this.handleWheel(e);
				e.preventDefault();
			},
			{ passive: false }
		);

		document.addEventListener('contextmenu', (e) => {
			e.preventDefault(); // Verhindert das Kontextmenü
		});

		window.addEventListener('beforeunload', () => {
			if (this.ws && this.isConnected) {
				this.ws.send(JSON.stringify({
					type: 'user_disconnect',
					userId: this.userId
				}));
			}
		});

		window.addEventListener('resize', () => {
			this.setupInitialView();
		});
	}

	handleMouseMove(e) {
		const screenX = e.clientX;
		const screenY = e.clientY;

		// Konvertiere Screen-Koordinaten zu Bild-Koordinaten
		const imageCoords = this.screenToImageCoords(screenX, screenY);

		// Aktualisiere die eigene Cursor-Position (Screen-Koordinaten für Display)
		this.updateOwnCursor(screenX, screenY);

		// Sende Bild-Koordinaten an Server
		if (this.ws && this.isConnected) {
			this.ws.send(JSON.stringify({
				type: 'cursor_update',
				userId: this.userId,
				name: this.username,
				x: imageCoords.x,
				y: imageCoords.y
			}));
		}

		// Handle Mittlere Maustaste - Bild verschieben
		if (this.isMiddleMouseDown && this.middleClickStart) {
			const deltaX = screenX - this.middleClickStart.screenX;
			const deltaY = screenY - this.middleClickStart.screenY;
			
			this.offsetX = this.middleClickStart.offsetX + deltaX;
			this.offsetY = this.middleClickStart.offsetY + deltaY;
			
			this.updateImageTransform();
			this.tokenHandlerElement.setOffsetForTokens(this.offsetX, this.offsetY, this.scale);
			
		}
		
		// Aktualisiere die Distanzmessung falls Rechtsklick aktiv
		if (this.isRightMouseDown && this.rightClickStart) {
			this.updateDistanceMeasurement(imageCoords.x, imageCoords.y);
		}
		var tokenUpdate = this.tokenHandlerElement.onMouseMove(imageCoords,this.isLeftMouseDown, this.isRightMouseDown);
		//console.log(this.ws, this.isConnected, tokenUpdate);
		if (this.ws && this.isConnected && tokenUpdate) {
			//console.log("Sent",tokenUpdate);
			this.ws.send(JSON.stringify({
				type: 'token_update',
				userId: this.userId,
				id: tokenUpdate.id,
				x: tokenUpdate.x,
				y: tokenUpdate.y,
				rot: tokenUpdate.rot,
				scale: tokenUpdate.scale,
				tokenText: tokenUpdate.text,
				color: tokenUpdate.color,
				size: tokenUpdate.size,
				length: tokenUpdate.length,
				centerX: tokenUpdate.centerX,
				centerY: tokenUpdate.centerY,
				image: tokenUpdate.image.src
			}));
		}
	}

	handleDelete() {
		var delToken = this.tokenHandlerElement.deleteToken();
		if (this.ws && this.isConnected && delToken) {
			//console.log("Sent",tokenUpdate);
			this.ws.send(JSON.stringify({
				type: 'token_del',
				userId: this.userId,
				id: delToken
			}));
		}
	}

	screenToImageCoords(screenX, screenY) {
		// Konvertiere Screen-Koordinaten zu Bild-Koordinaten
		const imageX = (screenX - this.offsetX) / this.scale;
		const imageY = (screenY - this.offsetY) / this.scale;
		return { x: imageX, y: imageY };
	}

	imageCoordsToScreen(imageX, imageY) {
		// Konvertiere Bild-Koordinaten zu Screen-Koordinaten
		const screenX = imageX * this.scale + this.offsetX;
		const screenY = imageY * this.scale + this.offsetY;
		return { x: screenX, y: screenY };
	}

	updateImageTransform() {
		if (this.imageLayer) {
			this.imageLayer.style.transform = 
				`translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
		}
	}

	handleWheel(e) {
		const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
		const newScale = this.scale * zoomFactor;
		
		// Begrenze Zoom
		if (newScale < 0.1 || newScale > 5) return;
		
		// Zoome zum Mauszeiger
		const mouseX = e.clientX;
		const mouseY = e.clientY;
		
		const imageCoords = this.screenToImageCoords(mouseX, mouseY);
		
		this.scale = newScale;
		
		// Adjustiere Offset so dass der Punkt unter der Maus gleich bleibt
		const newScreenCoords = this.imageCoordsToScreen(imageCoords.x, imageCoords.y);
		this.offsetX += mouseX - newScreenCoords.x;
		this.offsetY += mouseY - newScreenCoords.y;
		
		this.updateImageTransform();
		this.tokenHandlerElement.setOffsetForTokens(this.offsetX, this.offsetY, this.scale);
	}

	handleMiddleMouseDown(e) {
		this.isMiddleMouseDown = true;
		this.middleClickStart = {
			screenX: e.clientX,
			screenY: e.clientY,
			offsetX: this.offsetX,
			offsetY: this.offsetY
		};
		document.body.style.cursor = 'grabbing';
	}

	handleMiddleMouseUp(e) {
		this.isMiddleMouseDown = false;
		this.middleClickStart = null;
		document.body.style.cursor = 'crosshair';
	}
	
	handleLeftMouseDown(e) {
		this.isLeftMouseDown = true;
		this.leftClickStart = {
			screenX: e.clientX,
			screenY: e.clientY,
			offsetX: this.offsetX,
			offsetY: this.offsetY
		};
		if (this.isRightMouseDown) {
			this.screenToImageCoords(e.clientX, e.clientY);
			this.rightClickId++;
			const imageCoords = this.screenToImageCoords(e.clientX, e.clientY);
			this.createDistanceMeasurement(this.rightClickId);
			this.measurePoints[this.rightClickId] = imageCoords;
			}
		this.tokenHandlerElement.handleLeftMouse("DOWN");
	}
	
	handleLeftMouseUp(e) {
		this.isLeftMouseDown = false;
		this.leftClickStart = null;
		this.tokenHandlerElement.handleLeftMouse("UP");
	}

	handleRightMouseDown(e) {
		this.isRightMouseDown = true;
		const imageCoords = this.screenToImageCoords(e.clientX, e.clientY);
		this.rightClickStart = imageCoords;
		this.rightClickId = 0;
		this.createDistanceMeasurement(0);
		this.measurePoints[this.rightClickId] = imageCoords;
		this.tokenHandlerElement.handleLeftMouse("DOWN");
	}

	handleRightMouseUp(e) {
		this.isRightMouseDown = false;
		this.rightClickStart = null;
		this.rightClickId = null;
		this.removeDistanceMeasurement();
		this.measurePoints = [];
		this.tokenHandlerElement.handleLeftMouse("UP");
	}

	updateOwnCursor(x, y) {
		let ownCursor = document.getElementById('own-cursor');
		if (!ownCursor) {
			ownCursor = this.createCursor('own-cursor', this.username, '#4444ff', true);
		}
		ownCursor.style.left = x + 'px';
		ownCursor.style.top = y + 'px';
	}

	createCursor(id, name, color, isOwn = false) {
		const cursor = document.createElement('div');
		cursor.className = 'cursor' + (isOwn ? ' own-cursor' : '');
		cursor.id = id;
		cursor.style.borderColor = color;
		cursor.style.background = this.hexToRgba(color, 0.3);

		const label = document.createElement('div');
		label.className = 'cursor-label';
		label.textContent = name;
		cursor.appendChild(label);

		document.body.appendChild(cursor);
		this.cursors.set(id, cursor);

		return cursor;
	}

	updateCursorPosition(id, imageX, imageY) {
		const cursor = this.cursors.get(id);
		if (cursor) {
			// Konvertiere Bild-Koordinaten zu Screen-Koordinaten für Display
			const screenCoords = this.imageCoordsToScreen(imageX, imageY);
			cursor.style.left = screenCoords.x + 'px';
			cursor.style.top = screenCoords.y + 'px';
			
			// Verstecke Cursor wenn außerhalb des sichtbaren Bereichs
			const isVisible = screenCoords.x >= -20 && screenCoords.x <= window.innerWidth + 20 &&
							 screenCoords.y >= -20 && screenCoords.y <= window.innerHeight + 20;
			cursor.style.display = isVisible ? 'block' : 'none';
		}
	}

	removeCursor(id) {
		const cursor = this.cursors.get(id);
		if (cursor) {
			cursor.remove();
			this.cursors.delete(id);
		}
	}

	createDistanceMeasurement(id) {
		let distObject = document.createElement('div');
		distObject.className = `distance-line ${this.fadeOutToggle}`;
		distObject.id = `distance-line${id}`;
		this.distanceLine[id] = distObject;
		document.body.appendChild(this.distanceLine[id]);

		distObject = document.createElement('div');
		distObject.className = `distance-label ${this.fadeOutToggle}`;
		distObject.id = `distance-label${id}`;
		
		this.distanceLabel[id] = distObject;
		document.body.appendChild(this.distanceLabel[id]);
	}

	updateDistanceMeasurement(currentImageX, currentImageY) {
		//!this.distanceLine.length || !this.distanceLabel || 
		if (!this.rightClickStart) return;
		
		let totalDist = 0;
		for (let i = 0; i < this.measurePoints.length; i++) {
			const startImageX = this.measurePoints[i].x;
			const startImageY = this.measurePoints[i].y;

			let endImageX = currentImageX;
			let endImageY = currentImageY;
			if (i+1 < this.measurePoints.length) {
				endImageX = this.measurePoints[i+1].x;
				endImageY = this.measurePoints[i+1].y;
			}
			// Berechne Distanz in Bild-Koordinaten
			const deltaX = endImageX - startImageX;
			const deltaY = endImageY - startImageY;
			const pixelsForFoot = this.pixelsForField/5;
			const additiveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / pixelsForFoot;
			const imageDistance = totalDist + additiveDistance;
			totalDist = imageDistance;
			
			// Konvertiere zu Screen-Koordinaten für Darstellung
			const startScreen = this.imageCoordsToScreen(startImageX, startImageY);
			const currentScreen = this.imageCoordsToScreen(endImageX, endImageY);
			
			const screenDeltaX = currentScreen.x - startScreen.x;
			const screenDeltaY = currentScreen.y - startScreen.y;
			const screenDistance = Math.sqrt(screenDeltaX * screenDeltaX + screenDeltaY * screenDeltaY);
			const angle = Math.atan2(screenDeltaY, screenDeltaX) * 180 / Math.PI;

			// Aktualisiere Linie (Screen-Koordinaten)
			let distObject = this.distanceLine[i];
			distObject.style.left = startScreen.x + 'px';
			distObject.style.top = startScreen.y + 'px';
			distObject.style.width = screenDistance + 'px';
			distObject.style.transform = `rotate(${angle}deg)`;
			this.distanceLine[i] = distObject;
			
			// Aktualisiere Label (in der Mitte der Linie, zeigt Bild-Distanz)
			const midScreenX = startScreen.x + screenDeltaX / 2;
			const midScreenY = startScreen.y + screenDeltaY / 2;
			distObject = this.distanceLabel[i];
			distObject.style.left = midScreenX + 'px';
			distObject.style.top = midScreenY + 'px';
			distObject.style.textAlign = 'center';
			if (additiveDistance != imageDistance) {
				distObject.style.whiteSpace = 'pre';
				distObject.textContent = `${Math.round(imageDistance)}ft\r\n+${Math.round(additiveDistance)}ft`;
			} else {
				distObject.textContent = `${Math.round(imageDistance)}ft`;
			}
			this.distanceLabel[i] = distObject;
		}
	}

	/*removeDistanceMeasurement() {
		for (let i = 0; i < this.measurePoints.length; i++) {
			if (this.distanceLine[i]) {
				this.distanceLine[i].remove();
				this.distanceLine[i] = null;
			}
			if (this.distanceLabel[i]) {
				this.distanceLabel[i].remove();
				this.distanceLabel[i] = null;
			}
		}
	}*/

	fadeOutAndRemove(el) {
		if (!el) return;
		el.classList.add('fade-out');           // start the fade
		// wait for the CSS transition to finish, then delete the node
		el.addEventListener('transitionend', () => el.remove(), { once: true });
	}

	removeDistanceMeasurement() {
		for (let i = 0; i < this.measurePoints.length; i++) {
			this.fadeOutAndRemove(this.distanceLine[i]);
			this.fadeOutAndRemove(this.distanceLabel[i]);

			// leave refs until removal finishes; they’ll be GC‑safe afterwards
			this.distanceLine[i]  = null;
			this.distanceLabel[i] = null;
		}
	}

	getRandomColor() {
		const colors = ['#ff4444', '#44ff44', '#ffff44', '#ff44ff', '#44ffff', '#ff8844'];
		return colors[Math.floor(Math.random() * colors.length)];
	}

	hexToRgba(hex, opacity) {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${opacity})`;
	}

	updateStatus(message) {
		document.getElementById('status').textContent = message;
	}
}

function startApp() {
	const username = document.getElementById('username').value.trim();
	if (!username) {
		alert('Please enter your name!');
		return;
	}

	document.getElementById('name-input').style.display = 'none';
	document.getElementById('setup-info').style.display = 'none';
	
	cursorTrackerElement = new CursorTracker(username);
}
