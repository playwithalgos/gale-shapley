<script>
	const n = 5;
	function randomArray(n) {
		const A = new Array(n).fill(0).map((v, i) => i);
		for (let i = n - 1; i >= 0; i--) {
			const j = Math.floor(Math.random() * i);
			[A[i], A[j]] = [A[j], A[i]];
		}
		console.log(A);

		return A;
	}
	let aPrefs = new Array(n).fill(0).map(() => randomArray(n));
	let bPrefs = new Array(n).fill(0).map(() => randomArray(n));

	console.log(aPrefs);
	function beep() {
		const snd = new Audio(
			"data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU="
		);
		snd.play();
	}
	beep();

	let matching = new Array(n).fill(-1);
	let next = new Array(n).fill(0);
	let currentB = -1;
	let currentA = -1;

	function isHappy() {
		if(currentA < 0) return false;
		if(currentB < 0) return false;

		const a = currentA;
		const b = currentB;
		const a1 = matching.indexOf(b);
		if (a1 == -1) return true;
		return bPrefs[b].indexOf(a) < bPrefs[b].indexOf(a1);
	}

	let imagesA = ["1F43C", "1F431", "1F437", "1F42E", "1F43B"];
	function agentAimg(a) {
		return `<img src='https://openmoji.org/data/color/svg/${imagesA[a]}.svg'/>`;
	}

	let imagesB = ["1F996", "1F438", "1F424", "1F414", "1F997"];
	function agentBimg(b) {
		return `<img src='https://openmoji.org/data/color/svg/${imagesB[b]}.svg'/>`;
	}
	function tryMarry(a, b) {
		if (matching[a] != -1 || b != aPrefs[a][next[a]]) {
			console.log(matching[a]);
			beep();
			return;
		}

		next[a]++;

		const a1 = matching.indexOf(b);
		if (a1 == -1) matching[a] = b;
		else if (bPrefs[b].indexOf(a) < bPrefs[b].indexOf(a1)) {
			matching[a] = b;
			matching[a1] = -1;
		}
		matching = matching;
		next = next;
	}
</script>

<main>
	<h1>Gale-Shapley algorithm</h1>
	<p />

	<div class="family">
		{#each aPrefs as aPref, a (aPref)}
			<div
				class="agentPref"
				on:mouseenter={() => (currentA = a)}
				on:mouseleave={() => (currentA = -1)}
			>
				<div class="agent agentA {matching[a] >= 0 ? 'married' : ''} {currentA == a ? 'current' : ''}">
					{@html agentAimg(a)}
				</div>
				o o o
				<div class="pref">
					{#each aPref as b, i (b)}
						{#if i > 0}
							<span>&gt;</span>
						{/if}
						<div
							class="agent agentB {currentA == a && currentB == b
								? 'current'
								: ''} {matching[a] == b ? 'married' : ''} {next[
								a
							] > i
								? 'asked'
								: ''}"
							on:click={() => tryMarry(a, b)}
							on:mouseenter={() => (currentB = b)}
							on:mouseleave={() => (currentB = -1)}
						>
							{@html agentBimg(b)}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<div class="family">
		{#each bPrefs as bPref, b (bPref)}
			<div class="agentPref">
				<div
					class="agent agentB {matching.indexOf(b) >= 0 ? 'married' : ''} {isHappy() && currentB == b
						? 'happy'
						: ''} {currentB == b ? 'current' : ''}"
				>
					{@html agentBimg(b)}
				</div>
				o o o
				<div class="pref">
					{#each bPref as a, i (a)}
						{#if i > 0}
							<span>&gt;</span>
						{/if}
						<div
							class="agent agentA  {isHappy() && currentA == a && currentB == b
								? 'happy'
								: ''} {currentA == a && currentB == b
								? 'current'
								: ''} {matching.indexOf(b) == a
								? 'married'
								: ''}"
						>
							{@html agentAimg(a)}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: fit-content;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 2em;
		font-weight: 300;
	}

	.agent {
		display: inline-block;
		width: 32px;
		margin: 2px;
		vertical-align: middle;
		border-radius: 8px;
	}

	.agentA {
		color: blue;
	}

	.agentB {
		color: violet;
	}

	.pref {
		border: solid 2px black;
		border-radius: 8px;
		display: inline-block;
	}

	.agentPref {
		padding: 3px;
		border: 1px solid white;
		vertical-align: middle;
	}

	.current {
		background-color: rgba(255, 128, 0, 0.3);
	}

	@keyframes rotation {
		from {
			transform: translate(0px, -4px);
		}
		to {
			transform: translate(0px, 0px);
		}
	}

	.happy {
		animation: rotation 200ms infinite alternate ease-in;
	}

	.asked {
		background-color: lightgray;
	}

	.married {
		background-color: deepskyblue;
	}

	.family {
		display: inline-block;
		margin: 32px;
	}
</style>
