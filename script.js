let bpm = 120;
let intervalId = null;
let isPlaying = false;
let isDeleteMode = false; // デリートモードフラグ
let selectedFavoriteIndex = -1; // 矢印キーで選択されたBPMのインデックス
let confirmedFavoriteIndex = -1; // エンターで確定したインデックス
const bpmDisplay = document.getElementById('bpmDisplay');
const favoritesContainer = document.getElementById('favorites');
const volumeControl = document.getElementById('volumeControl');
const scrollArea = document.getElementById('scrollArea');
const saveBPMButton = document.getElementById('saveBPMButton');
const deleteModeBtn = document.getElementById('deleteModeBtn');
let volume = 0.5;
let isEditingText = false; // テキスト編集中かどうかのフラグ

// MP3ファイルの読み込み
const metronomeClick = new Audio('click.mp3');

// 初期音量設定
metronomeClick.volume = volume;

// 現在のテキスト状態を保存する関数
function saveCurrentTextStates() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const favoriteElements = document.querySelectorAll('.favorite');
    
    favoriteElements.forEach((el, index) => {
        const textDiv = el.querySelector('.editable');
        favorites[index].text = textDiv.textContent;
        console.log(`テキスト状態を保存 (index: ${index}):`, textDiv.textContent);  // テキスト状態をログに出力
    });

    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// 削除モードの切り替え
function toggleDeleteMode() {
    saveCurrentTextStates();  // テキスト状態を保存
    isDeleteMode = !isDeleteMode;  // デリートモードの切り替え
    console.log("デリートモード:", isDeleteMode);  // デリートモードの状態をログに出力

    // デリートモードの状態に応じてボタンの見た目とテキストを変更
    if (isDeleteMode) {
        deleteModeBtn.style.backgroundColor = "darkred";
        deleteModeBtn.textContent = "Delete Mode Active";
    } else {
        deleteModeBtn.style.backgroundColor = "";
        deleteModeBtn.textContent = "Enter Delete Mode";
    }

    renderFavorites();  // 再描画して反映
}

// 再生クリック時の動作
scrollArea.addEventListener('click', () => {
    if (!isEditingText) {
        toggleMetronome();
    }
});

// キーボードのスペースキーで再生/停止
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !isEditingText) {
        event.preventDefault();
        toggleMetronome();
    }

    // 矢印キーでBPMリストの選択
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
        event.preventDefault();
        handleArrowNavigation(event.code);
    }

    // エンターキーでBPMの確定
    if (event.code === 'Enter' && selectedFavoriteIndex !== -1) {
        event.preventDefault();
        confirmSelectedBPM();
    }
});

// メトロノーム再生/停止
function toggleMetronome() {
    if (isPlaying) {
        stopMetronome();
    } else {
        startMetronome();
    }
    isPlaying = !isPlaying;
    updatePlayState();
}

// 再生/停止の表示更新
function updatePlayState() {
    if (isPlaying) {
        scrollArea.textContent = "Playing... Click to Pause";
        scrollArea.classList.add('playing');
    } else {
        scrollArea.textContent = "Click to Play";
        scrollArea.classList.remove('playing');
    }
}

// メトロノーム開始
function startMetronome() {
    const interval = (60 / bpm) * 1000;
    intervalId = setInterval(playClick, interval);
}

// メトロノーム停止
function stopMetronome() {
    clearInterval(intervalId);
    intervalId = null;
}

// MP3ファイルでクリック音を再生
function playClick() {
    metronomeClick.currentTime = 0; // 再生位置をリセット
    metronomeClick.play(); // 再生
}

// スクロールでBPM変更
document.addEventListener('wheel', (event) => {
    event.preventDefault();
    bpm += event.deltaY > 0 ? -1 : 1;
    if (bpm < 30) bpm = 30;
    if (bpm > 300) bpm = 300;
    selectedFavoriteIndex = -1;
    confirmedFavoriteIndex = -1;
    updateBPMDisplay();
    updateMetronomeBPM();
    highlightSelectedFavorite();
}, { passive: false });  // ここでpassive: falseを指定

// 矢印キーで保存BPMの選択
function handleArrowNavigation(keyCode) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (favorites.length === 0) return;

    if (keyCode === 'ArrowUp') {
        selectedFavoriteIndex = (selectedFavoriteIndex > 0) ? selectedFavoriteIndex - 1 : favorites.length - 1;
    } else if (keyCode === 'ArrowDown') {
        selectedFavoriteIndex = (selectedFavoriteIndex < favorites.length - 1) ? selectedFavoriteIndex + 1 : 0;
    }

    highlightSelectedFavorite();
}

// 選択されたBPMのハイライト更新
function highlightSelectedFavorite() {
    const favoriteElements = document.querySelectorAll('.favorite');
    favoriteElements.forEach((el, index) => {
        el.classList.toggle('highlight', index === selectedFavoriteIndex); // 選択されたものにhighlightを付与
        if (index !== confirmedFavoriteIndex) {
            el.classList.remove('confirmed'); // 確定されたもの以外はconfirmedを削除
        }
    });
}

// 確定されたBPMの反映
function confirmSelectedBPM() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (selectedFavoriteIndex !== -1 && favorites[selectedFavoriteIndex]) {
        confirmedFavoriteIndex = selectedFavoriteIndex;
        bpm = favorites[confirmedFavoriteIndex].bpm;
        updateBPMDisplay();
        updateMetronomeBPM();

        const favoriteElements = document.querySelectorAll('.favorite');
        favoriteElements.forEach((el, index) => {
            el.classList.remove('highlight'); // highlightクラスを削除
            el.classList.toggle('confirmed', index === confirmedFavoriteIndex); // confirmedクラスを付与
        });
    }
}

// BPMの表示更新
function updateBPMDisplay() {
    bpmDisplay.textContent = `${bpm} BPM`;
}

// BPM変更時にリアルタイム反映
function updateMetronomeBPM() {
    if (isPlaying) {
        stopMetronome();
        startMetronome();
    }
}

// 音量調整スライダー
volumeControl.addEventListener('input', (event) => {
    volume = event.target.value;
    metronomeClick.volume = volume; // 音量を更新
});

// BPMセーブボタンの動作
saveBPMButton.addEventListener('click', () => {
    saveBPM();
});

// BPM保存処理
function saveBPM() {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    console.log("BPM保存前の状態:", favorites);  // 保存前の状態をログ出力
    if (!favorites.some(fav => fav.bpm === bpm)) {
        favorites.push({ bpm: bpm, text: "Click to edit" });
        favorites.sort((a, b) => a.bpm - b.bpm);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
    }
}

// 保存されたBPMを表示
function renderFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    console.log("renderFavorites: 現在の保存済みBPMとテキスト:", favorites);  // 現在のリストをログ出力

    favoritesContainer.innerHTML = '';  // リストをクリア
    favorites.forEach((favorite, index) => {
        const div = document.createElement('div');
        div.classList.add('favorite');
        if (isDeleteMode) {
            div.classList.add('deletable');  // デリートモードの時にクラス追加
            div.addEventListener('click', () => deleteBPM(favorite.bpm));  // デリートモードでは削除可能
        }

        const bpmDiv = document.createElement('div');
        bpmDiv.textContent = `${favorite.bpm} BPM`;
        bpmDiv.classList.add('bpm');

        bpmDiv.addEventListener('click', () => {
            if (!isDeleteMode) {  // デリートモードでない場合のみ選択可能
                selectedFavoriteIndex = index;  // 選択されたBPMを設定
                confirmSelectedBPM();  // 選択を確定してハイライトを適用
            }
        });

        const textDiv = document.createElement('div');
        textDiv.textContent = favorite.text;
        textDiv.classList.add('editable');
        textDiv.setAttribute('contenteditable', false);

        textDiv.addEventListener('click', () => {
            if (!isDeleteMode) {  // 通常モードの時だけテキスト編集可能
                isEditingText = true;
                if (textDiv.textContent === "Click to edit") {
                    textDiv.textContent = "";  // 初期値ならクリア
                }
                textDiv.setAttribute('contenteditable', true);
                textDiv.focus();
                textDiv.addEventListener('blur', () => {
                    isEditingText = false;
                    if (textDiv.textContent === "") {
                        textDiv.textContent = "Click to edit";
                    }
                    textDiv.setAttribute('contenteditable', false);
                    favorite.text = textDiv.textContent;
                    saveCurrentTextStates();  // テキスト編集後に保存
                });

                // エンターキーでテキスト変更を確定
                textDiv.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        textDiv.blur();  // エンターで確定
                    }
                });
            }
        });

        div.appendChild(bpmDiv);
        div.appendChild(textDiv);

        favoritesContainer.appendChild(div);
    });
}

// 保存BPM削除処理
function deleteBPM(bpmToDelete) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favorites = favorites.filter(fav => fav.bpm !== bpmToDelete);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
}

// ページ読み込み時にオーディオコンテキストを初期化
renderFavorites();
