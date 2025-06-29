const amountGroup = document.getElementById('amountGroup');
const facesGroup = document.getElementById('facesGroup');

const diceTypes = [4, 6, 8, 10, 12, 20];

function createRadioButtons(groupEl, items, groupName, buttonsPerRow, formatterFn) {
	groupEl.innerHTML = '';
	items.forEach((item, index) => {
		const id = `${groupName}_${item}`;
		const input = document.createElement('input');
		input.type = 'radio';
		input.name = groupName;
		input.id = id;
		input.value = item;
		if (index === 0) input.checked = true;

		const label = document.createElement('label');
		label.className = 'dice-item';
		label.htmlFor = id;
		label.textContent = formatterFn(item);

		groupEl.appendChild(input);
		groupEl.appendChild(label);
	});
}

function handleRoll() {
	const amount = parseInt(document.querySelector('input[name="amount"]:checked').value);
	const faces = parseInt(document.querySelector('input[name="faces"]:checked').value);
	const result = rollDiceExpression(`${amount}d${faces}`);
	document.getElementById('result').textContent = result.tray;
	
	document.getElementById('resultLog').textContent+= result.log;
	document.getElementById('resultLog').textContent = keepLastLines(document.getElementById('resultLog').textContent, 51);
}

function rollDice(amount, faces) {
	const rolls = [];
	for (let i = 0; i < amount; i++) {
		rolls.push(Math.floor(Math.random() * faces) + 1);
	}
	return rolls;
}
function keepLastLines(text, maxLines) {
	const lines = text.split('\n');
	if (lines.length <= maxLines) return text;
	return '...\n' + lines.slice(-maxLines).join('\n');
}
function rollDiceExpression(expr) {
	const username = document.getElementById('username').value.trim();
	const parts = expr.toLowerCase().replace(/\s+/g, '').split('+');
	let total = 0;
	let details = [];

	for (let part of parts) {
		if (part.includes('d')) {
			const [amountStr, faceStr] = part.split('d');
			const amount = parseInt(amountStr || '1');
			const faces = parseInt(faceStr);
			if (!amount || !faces) continue;

			const rolls = rollDice(amount, faces);
			total += rolls.reduce((a, b) => a + b, 0);
			details.push(`${amount}d${faces}: [${rolls.join(', ')}]`);
		} else {
			const bonus = parseInt(part);
			if (!isNaN(bonus)) {
				total += bonus;
				details.push(`+${bonus}`);
			}
		}
	}
	// 🔔 Fire the custom event with roll data
	const event = new CustomEvent('diceRolled', {
		detail: {
			userId: username,
			result:`${username}: ${details.join('\n')}\n${username}: Total: ${total}\n`
		}
	});
	document.dispatchEvent(event);
	return {tray:`Roll breakdown:\n${details.join('\n')}\n\nTotal: ${total}`, 
			log:`${username}: ${details.join('\n')}\n${username}: Total: ${total}\n`};
}

// Init
createRadioButtons(
	amountGroup,
	Array.from({ length: 12 }, (_, i) => i + 1),
	'amount',
	2,
	(val) => `${val}x`
);

createRadioButtons(
	facesGroup,
	diceTypes,
	'faces',
	2,
	(val) => `d${val}`
);