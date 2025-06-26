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