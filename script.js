let bpm = 120;
// let intervalId = null; // Web Audio APIでは不要になる
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
let volume = 0.5;
let isEditingText = false;

// Web Audio API 関連の変数
let audioContext;
let metronomeSoundBuffer = null; // デコードされたオーディオデータを格納
let gainNode; // 音量制御用
let nextNoteTime = 0.0; // 次のノートが再生されるべき時間
let schedulerTimerId = null; // schedulerのタイマーID
const lookahead = 25.0; // ms - スケジューリングをどのくらい先読みするか
const scheduleAheadTime = 0.1; // seconds - どのくらい先までノートをスケジュールするか

// AudioContextを初期化する関数（ユーザー操作時に呼び出す）
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = volume;
        loadMetronomeSound('click.mp3'); // サウンドファイルをロード
    }
    // iOSなどでユーザー操作後にContextを再開する必要がある場合
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

// サウンドファイルをロードしてデコードする関数
async function loadMetronomeSound(url) {
    if (!audioContext) return;
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        metronomeSoundBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log("Metronome sound loaded and decoded.");
    } catch (e) {
        console.error("Error loading or decoding metronome sound:", e);
    }
}

// スケジュールされた時間にサウンドを再生する関数
function playScheduledSound(time) {
    if (!metronomeSoundBuffer || !audioContext || !gainNode) {
        console.log("Audio components not ready or sound buffer not loaded.");
        return;
    }
    const source = audioContext.createBufferSource();
    source.buffer = metronomeSoundBuffer;
    source.connect(gainNode);
    source.start(time);
}

// 次のノートをスケジュールする関数
function scheduleNote(beatNumber, time) {
    // ここでは単純にクリック音を鳴らすだけ
    playScheduledSound(time);
}

// スケジューラ関数：次のノートをスケジュールし続ける
function scheduler() {
    if (!isPlaying || !audioContext) {
        clearTimeout(schedulerTimerId);
        return;
    }

    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
        scheduleNote(0, nextNoteTime); // beatNumber はここでは未使用
        const secondsPerBeat = 60.0 / bpm;
        nextNoteTime += secondsPerBeat;
    }
    schedulerTimerId = setTimeout(scheduler, lookahead);
}


// メトロノーム開始
function startMetronome() {
    if (!audioContext || audioContext.state === 'suspended') {
        initAudioContext(); // AudioContextがなければ初期化、または再開
    }
    if (!metronomeSoundBuffer) {
        console.warn("Metronome sound not loaded yet. Please wait and try again.");
        // 必要であれば、ロード完了を待つか、ユーザーに通知するUIを出す
        return;
    }

    isPlaying = true;
    if (audioContext && audioContext.state === 'running') {
        nextNoteTime = audioContext.currentTime + 0.1; // 少し未来から開始
        scheduler(); // スケジューラを起動
        updatePlayState();
    } else {
         // AudioContextがまだ準備できていない場合があるため、少し待って再試行するロジックも考慮できる
        console.log("AudioContext not running. Attempting to resume/start...");
        // initAudioContext内でresumeを試みるが、それでもダメな場合はユーザーにもう一度操作を促すなど
        isPlaying = false; // 開始できなかった
    }
}

// メトロノーム停止
function stopMetronome() {
    isPlaying = false;
    clearTimeout(schedulerTimerId); // スケジューラを停止
    updatePlayState();
}

// --- 既存の関数群 (toggleMetronome, updatePlayState など) ---
// toggleMetronome は startMetronome と stopMetronome を呼び出すように変更
function toggleMetronome() {
    if (!audioContext || audioContext.state === 'suspended') {
        initAudioContext(); // AudioContextの初期化/再開を試みる
    }
    // サウンドがロードされるまで待つか、ロード中の表示を出すことを推奨
    if (!metronomeSoundBuffer && !isPlaying) { // 再生開始時のみチェック
        alert("サウンドファイルを読み込み中です。少し待ってからもう一度お試しください。");
        loadMetronomeSound('click.mp3'); //念のため再ロード試行
        return;
    }

    if (isPlaying) {
        stopMetronome();
    } else {
        // isPlaying = true; // startMetronome内で行うので不要
        startMetronome();
    }
    // isPlaying = !isPlaying; // start/stopMetronome内で管理
    // updatePlayState(); // start/stopMetronome内で管理
}

function updatePlayState() {
    if (isPlaying) {
        scrollArea.textContent = "Playing... Click to Pause";
        scrollArea.classList.add('playing');
    } else {
        scrollArea.textContent = "Click to Play";
        scrollArea.classList.remove('playing');
    }
}

// BPM変更時にリアルタイム反映 (Web AudioではnextNoteTimeの計算に使われるbpmが変わればOK)
function updateMetronomeBPM() {
    // isPlaying中でも、scheduler内のnextNoteTime計算で新しいbpmが使われる
    // 特に再起動は不要だが、より即時性を求めるならnextNoteTimeを再計算してスケジューラを再起動しても良い
    if (isPlaying) {
        // 実行中のスケジューラは次のループから新しいBPMを参照する
    }
}


// BPMの表示更新
function updateBPMDisplay() {
    bpmDisplay.textContent = `${bpm} BPM`;
}

// 音量調整スライダー
volumeControl.addEventListener('input', (event) => {
    volume = parseFloat(event.target.value);
    if (gainNode && audioContext && audioContext.state === 'running') {
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    } else if (gainNode) { // AudioContextがまだsuspendedの場合でもgainNodeは存在しうる
        gainNode.gain.value = volume;
    }
});

// --- 以下、既存のUI操作関連の関数 (変更なし、または微調整) ---

// 現在のテキスト状態を保存する関数
function saveCurrentTextStates() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const favoriteElements = document.querySelectorAll('.favorite');
    
    favoriteElements.forEach((el, index) => {
        if (favorites[index]) { // favorites[index] が存在することを確認
            const textDiv = el.querySelector('.editable');
            favorites[index].text = textDiv.textContent;
        }
    });
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// 削除モードの切り替え
function toggleDeleteMode() {
    saveCurrentTextStates();
    isDeleteMode = !isDeleteMode;
    if (isDeleteMode) {
        deleteModeBtn.style.backgroundColor = "darkred";
        deleteModeBtn.textContent = "Delete Mode Active";
    } else {
        deleteModeBtn.style.backgroundColor = ""; // 元の色に戻す（CSSで定義されていれば不要かも）
        deleteModeBtn.textContent = "Enter Delete Mode";
    }
    renderFavorites();
}

// 再生クリック時の動作
scrollArea.addEventListener('click', () => {
    if (!isEditingText) {
        // AudioContextをユーザー操作で初期化/再開
        if (!audioContext || audioContext.state === 'suspended') {
            initAudioContext();
        }
        toggleMetronome();
    }
});

// キーボードのスペースキーで再生/停止
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !isEditingText) {
        event.preventDefault();
        if (!audioContext || audioContext.state === 'suspended') {
            initAudioContext();
        }
        toggleMetronome();
    }

    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
        event.preventDefault();
        handleArrowNavigation(event.code);
    }

    if (event.code === 'Enter' && selectedFavoriteIndex !== -1) {
        event.preventDefault();
        confirmSelectedBPM();
    }
});

// スクロールでBPM変更
document.addEventListener('wheel', (event) => {
    event.preventDefault();
    const oldBpm = bpm;
    bpm += event.deltaY > 0 ? -1 : 1;
    if (bpm < 30) bpm = 30;
    if (bpm > 300) bpm = 300;
    
    if (bpm !== oldBpm) { // BPMが実際に変更された場合のみ更新
        selectedFavoriteIndex = -1;
        confirmedFavoriteIndex = -1; // BPM変更時は確定状態をリセット
        updateBPMDisplay();
        updateMetronomeBPM(); // Web Audio API用に調整された関数を呼ぶ
        highlightSelectedFavorite(); // ハイライトもリセット（または現在のBPMに合うものがあれば選択）
        // 必要であれば、確定BPMのスタイルもリセット
        const favoriteElements = document.querySelectorAll('.favorite.confirmed');
        favoriteElements.forEach(el => el.classList.remove('confirmed'));

    }
}, { passive: false });

function handleArrowNavigation(keyCode) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (favorites.length === 0) return;

    if (keyCode === 'ArrowUp') {
        selectedFavoriteIndex = (selectedFavoriteIndex > 0) ? selectedFavoriteIndex - 1 : favorites.length - 1;
    } else if (keyCode === 'ArrowDown') {
        selectedFavoriteIndex = (selectedFavoriteIndex < favorites.length - 1) ? selectedFavoriteIndex + 1 : 0;
    }
    confirmedFavoriteIndex = -1; // 矢印キー操作時は確定状態を一旦リセット
    highlightSelectedFavorite();
}

function highlightSelectedFavorite() {
    const favoriteElements = document.querySelectorAll('.favorite');
    favoriteElements.forEach((el, index) => {
        el.classList.toggle('highlight', index === selectedFavoriteIndex);
        // 確定されたもの以外はconfirmedを削除 (confirmSelectedBPMで行うのでここでは不要かも)
        if (index !== confirmedFavoriteIndex) {
            el.classList.remove('confirmed');
        }
    });
}

function confirmSelectedBPM() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (selectedFavoriteIndex !== -1 && favorites[selectedFavoriteIndex]) {
        confirmedFavoriteIndex = selectedFavoriteIndex;
        bpm = favorites[confirmedFavoriteIndex].bpm;
        updateBPMDisplay();
        updateMetronomeBPM();

        const favoriteElements = document.querySelectorAll('.favorite');
        favoriteElements.forEach((el, index) => {
            el.classList.remove('highlight');
            el.classList.toggle('confirmed', index === confirmedFavoriteIndex);
        });
    }
}

saveBPMButton.addEventListener('click', () => {
    saveBPM();
});

function saveBPM() {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (!favorites.some(fav => fav.bpm === bpm)) {
        favorites.push({ bpm: bpm, text: "Click to edit" });
        favorites.sort((a, b) => a.bpm - b.bpm); // BPMでソート
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
    }
}

function renderFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favoritesContainer.innerHTML = '';
    favorites.forEach((favorite, index) => {
        const div = document.createElement('div');
        div.classList.add('favorite');
        if (isDeleteMode) {
            div.classList.add('deletable');
            div.addEventListener('click', (e) => {
                // テキスト編集エリアへのクリック伝播を防ぐ
                if (e.target.classList.contains('editable')) return;
                deleteBPM(favorite.bpm)
            });
        }

        const bpmDiv = document.createElement('div');
        bpmDiv.textContent = `${favorite.bpm} BPM`;
        bpmDiv.classList.add('bpm');
        bpmDiv.addEventListener('click', (e) => {
            if (!isDeleteMode) {
                selectedFavoriteIndex = index;
                confirmSelectedBPM();
            } else {
                 // デリートモード時はBPM部分クリックでも削除
                deleteBPM(favorite.bpm);
            }
        });

        const textDiv = document.createElement('div');
        textDiv.textContent = favorite.text || "Click to edit";
        textDiv.classList.add('editable');
        textDiv.setAttribute('contenteditable', 'false'); // 初期状態は編集不可

        textDiv.addEventListener('click', () => {
            if (!isDeleteMode) {
                isEditingText = true;
                textDiv.setAttribute('contenteditable', 'true');
                if (textDiv.textContent === "Click to edit") {
                    textDiv.textContent = "";
                }
                textDiv.focus();
                // blurイベントは一度だけ登録するようにする
                const onBlur = () => {
                    isEditingText = false;
                    if (textDiv.textContent.trim() === "") {
                        textDiv.textContent = "Click to edit";
                    }
                    textDiv.setAttribute('contenteditable', 'false');
                    favorite.text = textDiv.textContent;
                    saveCurrentTextStates();
                    textDiv.removeEventListener('blur', onBlur); // 登録解除
                    textDiv.removeEventListener('keydown', onKeydown);
                };
                const onKeydown = (event) => {
                     if (event.key === 'Enter') {
                        event.preventDefault();
                        textDiv.blur();
                    }
                }
                textDiv.addEventListener('blur', onBlur);
                textDiv.addEventListener('keydown', onKeydown);
            }
        });

        div.appendChild(bpmDiv);
        div.appendChild(textDiv);
        favoritesContainer.appendChild(div);
    });
    // 選択/確定状態の再適用
    highlightSelectedFavorite();
    if(confirmedFavoriteIndex !== -1 && favoritesContainer.children[confirmedFavoriteIndex]) {
        favoritesContainer.children[confirmedFavoriteIndex].classList.add('confirmed');
    }
}

function deleteBPM(bpmToDelete) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favorites = favorites.filter(fav => fav.bpm !== bpmToDelete);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    // 削除後、選択/確定インデックスをリセットまたは調整
    if (confirmedFavoriteIndex !== -1 && favorites[confirmedFavoriteIndex]?.bpm === bpmToDelete) {
        confirmedFavoriteIndex = -1;
    }
    if (selectedFavoriteIndex !== -1 && favorites[selectedFavoriteIndex]?.bpm === bpmToDelete) {
        selectedFavoriteIndex = -1;
    }
    renderFavorites();
}

// ページ読み込み時に favorites を表示
renderFavorites();
// AudioContextの初期化はユーザーのインタラクションを待つ
// loadMetronomeSound('click.mp3'); // ここではなく、initAudioContext内で行う
