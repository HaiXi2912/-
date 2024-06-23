const audioFileInput = document.getElementById('audio-file');
const audioPlayer = document.getElementById('audio-player');
const songNameInput = document.getElementById('song-name');
const songDurationInput = document.getElementById('song-duration');
const bpmInput = document.getElementById('bpm');
const startComposingButton = document.getElementById('start-composing');
const exportChartButton = document.getElementById('export-chart');
const timeline = document.getElementById('timeline');

let arranger = [];
let intervalId = null;

audioFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        audioPlayer.src = url;
    }
});

startComposingButton.addEventListener('click', () => {
    const bpm = parseFloat(bpmInput.value);
    const duration = parseFloat(songDurationInput.value);
    const totalBeats = bpm * duration; // 总节拍数

    arranger = new Array(totalBeats).fill(0);
    timeline.innerHTML = '';
    audioPlayer.currentTime = 0;

    audioPlayer.play();

    intervalId = setInterval(() => {
        addNoteToTimeline(totalBeats);
    }, 1000 / bpm); // 根据节拍数设置间隔

    document.addEventListener('keydown', recordNote);
});

exportChartButton.addEventListener('click', () => {
    const chart = {
        name: songNameInput.value,
        time: songDurationInput.value,
        bpm: parseFloat(bpmInput.value),
        arranger: arranger
    };
    const chartStr = JSON.stringify(chart, null, 2);
    const blob = new Blob([chartStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${songNameInput.value}.chart.json`;
    a.click();

    clearInterval(intervalId);
    document.removeEventListener('keydown', recordNote);
});

function recordNote (e) {
    const currentTime = audioPlayer.currentTime;
    const bpm = parseFloat(bpmInput.value);
    const beatIndex = Math.floor(currentTime * bpm); // 当前时间对应的节拍索引

    console.log(`Key pressed: ${e.key}, Beat index: ${beatIndex}`);

    if (beatIndex >= arranger.length) return;

    if (e.key === 'ArrowLeft') {
        arranger[beatIndex] = -1;
        updateNoteOnTimeline(beatIndex, 'left');
    } else if (e.key === 'ArrowRight') {
        arranger[beatIndex] = 1;
        updateNoteOnTimeline(beatIndex, 'right');
    }
}

function addNoteToTimeline(totalBeats) {
    timeline.innerHTML = '';
    for (let i = 0; i < totalBeats; i++) {
        const noteElement = document.createElement('div');
        noteElement.classList.add('note');
        noteElement.style.left = `${(i / totalBeats) * 100}%`;
        if (arranger[i] === -1) {
            noteElement.classList.add('left-note');
        } else if (arranger[i] === 1) {
            noteElement.classList.add('right-note');
        }
        noteElement.addEventListener('click', () => {
            arranger[i] = 0;
            timeline.removeChild(noteElement);
        });
        timeline.appendChild(noteElement);
    }
}

function updateNoteOnTimeline(index, direction) {
    const noteElements = timeline.querySelectorAll('.note');
    noteElements.forEach(noteElement => {
        const noteIndex = parseFloat(noteElement.style.left) / 100 * arranger.length;
        if (Math.floor(noteIndex) === index) {
            noteElement.classList.remove('left-note', 'right-note');
            if (direction === 'left') {
                noteElement.classList.add('left-note');
            } else if (direction === 'right') {
                noteElement.classList.add('right-note');
            }
        }
    });
}
