//getOffsetInfo


let cursorTrackerElement = null;

// Enter-Taste im Name-Input
document.addEventListener('DOMContentLoaded', () => {
	document.getElementById('username').addEventListener('keypress', (e) => {
		if (e.key === 'Enter') {
			startApp();
		}
	});
});





/*const throttledMouseMove = (function(func, limit) {
	let lastCall = 0;
	return function(...args) {
		const now = Date.now();
		if (now - lastCall >= limit) {
			lastCall = now;
			func.apply(this, args);
		}
	};
})(this.handleMouseMove.bind(this), 40);
document.addEventListener('mousemove', throttledMouseMove);*/