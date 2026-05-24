let bpm = 120;
let isPlaying = false;
let isDeleteMode = false;
let selectedFavoriteIndex = -1;
let confirmedFavoriteIndex = -1;

const bpmDisplay = document.getElementById('bpmDisplay');
const favoritesContainer = document.getElementById('favorites');
const volumeControl = document.getElementById('volumeControl');
const scrollArea = document.getElementById('scrollArea');
const saveBPMButton = document.getElementById('saveBPMButton');
const deleteModeBtn = document.getElementById('deleteModeBtn');
const playText = document.getElementById('playText');
let volume = 0.5;
let isEditingText = false;

// Web Audio API
let audioContext;
let gainNode;
let clickBuffer = null;
let nextNoteTime = 0.0;
let schedulerTimerId = null;
const lookahead = 25.0;
const scheduleAheadTime = 0.1;

// click音をBase64埋め込みで読み込む（ファイル不要）
const CLICK_B64 = 'data:audio/wav;base64,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';

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = volume;
        loadClickFromBase64();
    }
    if (audioContext.state === 'suspended') audioContext.resume();
}

let pendingStart = false;

async function loadClickFromBase64() {
    try {
        const res = await fetch(CLICK_B64);
        const arrayBuffer = await res.arrayBuffer();
        clickBuffer = await audioContext.decodeAudioData(arrayBuffer);
        if (pendingStart) {
            pendingStart = false;
            startMetronome();
        }
    } catch(e) {
        console.error('Sound load error:', e);
    }
}

function playScheduledSound(time) {
    if (!clickBuffer || !audioContext || !gainNode) return;
    const source = audioContext.createBufferSource();
    source.buffer = clickBuffer;
    source.connect(gainNode);
    source.start(time);
}

function scheduler() {
    if (!isPlaying || !audioContext) { clearTimeout(schedulerTimerId); return; }
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
        playScheduledSound(nextNoteTime);
        nextNoteTime += 60.0 / bpm;
    }
    schedulerTimerId = setTimeout(scheduler, lookahead);
}

function startMetronome() {
    if (!audioContext || audioContext.state === 'suspended') initAudioContext();
    if (!clickBuffer) {
        pendingStart = true; // ロード完了後に自動スタート
        return;
    }
    isPlaying = true;
    if (audioContext.state === 'running') {
        nextNoteTime = audioContext.currentTime + 0.05;
        scheduler();
        updatePlayState();
    } else {
        isPlaying = false;
    }
}

function stopMetronome() {
    isPlaying = false;
    clearTimeout(schedulerTimerId);
    updatePlayState();
}

function toggleMetronome() {
    if (!audioContext || audioContext.state === 'suspended') initAudioContext();
    if (isPlaying) {
        pendingStart = false;
        stopMetronome();
    } else {
        startMetronome();
    }
}

function updatePlayState() {
    if (isPlaying) {
        playText.textContent = 'PLAYING — CLICK TO PAUSE';
        scrollArea.classList.add('playing');
    } else {
        playText.textContent = 'CLICK TO PLAY';
        scrollArea.classList.remove('playing');
    }
}

function updateBPMDisplay() { bpmDisplay.textContent = bpm; }

volumeControl.addEventListener('input', (e) => {
    volume = parseFloat(e.target.value);
    if (gainNode) gainNode.gain.value = volume;
});

function saveCurrentTextStates() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    document.querySelectorAll('.favorite').forEach((el, i) => {
        if (favorites[i]) favorites[i].text = el.querySelector('.editable').textContent;
    });
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function toggleDeleteMode() {
    saveCurrentTextStates();
    isDeleteMode = !isDeleteMode;
    deleteModeBtn.textContent = isDeleteMode ? 'DELETE ON' : 'DELETE';
    deleteModeBtn.classList.toggle('active', isDeleteMode);
    renderFavorites();
}

scrollArea.addEventListener('click', () => {
    if (!isEditingText) toggleMetronome();
});

document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !isEditingText) {
        event.preventDefault(); toggleMetronome();
    }
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
        event.preventDefault(); handleArrowNavigation(event.code);
    }
    if (event.code === 'Enter' && selectedFavoriteIndex !== -1) {
        event.preventDefault(); confirmSelectedBPM();
    }
});

document.addEventListener('wheel', (event) => {
    event.preventDefault();
    const old = bpm;
    bpm += event.deltaY > 0 ? -1 : 1;
    if (bpm < 30) bpm = 30;
    if (bpm > 300) bpm = 300;
    if (bpm !== old) {
        selectedFavoriteIndex = -1; confirmedFavoriteIndex = -1;
        updateBPMDisplay();
        document.querySelectorAll('.favorite.confirmed').forEach(el => el.classList.remove('confirmed'));
        highlightSelectedFavorite();
    }
}, { passive: false });

function handleArrowNavigation(keyCode) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (!favorites.length) return;
    if (keyCode === 'ArrowUp') {
        selectedFavoriteIndex = selectedFavoriteIndex > 0 ? selectedFavoriteIndex - 1 : favorites.length - 1;
    } else {
        selectedFavoriteIndex = selectedFavoriteIndex < favorites.length - 1 ? selectedFavoriteIndex + 1 : 0;
    }
    confirmedFavoriteIndex = -1;
    highlightSelectedFavorite();
}

function highlightSelectedFavorite() {
    document.querySelectorAll('.favorite').forEach((el, i) => {
        el.classList.toggle('highlight', i === selectedFavoriteIndex);
        if (i !== confirmedFavoriteIndex) el.classList.remove('confirmed');
    });
}

function confirmSelectedBPM() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (selectedFavoriteIndex !== -1 && favorites[selectedFavoriteIndex]) {
        confirmedFavoriteIndex = selectedFavoriteIndex;
        bpm = favorites[confirmedFavoriteIndex].bpm;
        updateBPMDisplay();
        document.querySelectorAll('.favorite').forEach((el, i) => {
            el.classList.remove('highlight');
            el.classList.toggle('confirmed', i === confirmedFavoriteIndex);
        });
    }
}

saveBPMButton.addEventListener('click', () => { saveBPM(); saveBPMButton.blur(); });
deleteModeBtn.addEventListener('click', () => deleteModeBtn.blur());

function saveBPM() {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (!favorites.some(f => f.bpm === bpm)) {
        favorites.push({ bpm, text: 'Click to edit' });
        favorites.sort((a, b) => a.bpm - b.bpm);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
    }
}

function renderFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favoritesContainer.innerHTML = '';
    if (!favorites.length) {
        favoritesContainer.innerHTML = '<div class="empty-hint">NO SAVED BPM</div>';
        return;
    }
    favorites.forEach((favorite, index) => {
        const div = document.createElement('div');
        div.classList.add('favorite');
        if (isDeleteMode) {
            div.classList.add('deletable');
            div.addEventListener('click', () => deleteBPM(favorite.bpm));
        }
        const bpmDiv = document.createElement('div');
        bpmDiv.textContent = favorite.bpm;
        bpmDiv.classList.add('bpm');
        bpmDiv.addEventListener('click', () => {
            if (!isDeleteMode) { selectedFavoriteIndex = index; confirmSelectedBPM(); }
            else deleteBPM(favorite.bpm);
        });
        const textDiv = document.createElement('div');
        textDiv.textContent = favorite.text || 'Click to edit';
        textDiv.classList.add('editable');
        textDiv.setAttribute('contenteditable', 'false');
        textDiv.addEventListener('click', () => {
            if (!isDeleteMode) {
                isEditingText = true;
                textDiv.setAttribute('contenteditable', 'true');
                if (textDiv.textContent === 'Click to edit') textDiv.textContent = '';
                textDiv.focus();
                const onBlur = () => {
                    isEditingText = false;
                    if (!textDiv.textContent.trim()) textDiv.textContent = 'Click to edit';
                    textDiv.setAttribute('contenteditable', 'false');
                    favorite.text = textDiv.textContent;
                    saveCurrentTextStates();
                    textDiv.removeEventListener('blur', onBlur);
                    textDiv.removeEventListener('keydown', onKeydown);
                };
                const onKeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); textDiv.blur(); } };
                textDiv.addEventListener('blur', onBlur);
                textDiv.addEventListener('keydown', onKeydown);
            }
        });
        div.appendChild(bpmDiv);
        div.appendChild(textDiv);
        favoritesContainer.appendChild(div);
    });
    highlightSelectedFavorite();
    if (confirmedFavoriteIndex !== -1 && favoritesContainer.children[confirmedFavoriteIndex]) {
        favoritesContainer.children[confirmedFavoriteIndex].classList.add('confirmed');
    }
}

function deleteBPM(bpmToDelete) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favorites = favorites.filter(f => f.bpm !== bpmToDelete);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    selectedFavoriteIndex = -1; confirmedFavoriteIndex = -1;
    renderFavorites();
}

renderFavorites();
