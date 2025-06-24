// Data storage
let vocabulary = [];
let currentCardIndex = 0;
let isCardFlipped = false;

// Test variables
let testWords = [];
let currentTestIndex = 0;
let testStats = {
    total: 0,
    correct: 0,
    wrong: 0
};
let currentQuestion = null;

// Storage functions
function saveData() {
    try {
        const data = {
            vocabulary: vocabulary,
            currentCardIndex: currentCardIndex
        };
        localStorage.setItem('vocabularyApp', JSON.stringify(data));
    } catch (e) {
        console.log('Không thể lưu dữ liệu:', e);
    }
}
const today = new Date().toISOString().split('T')[0];
document.getElementById('selected-date').value = today;

function loadData() {
    try {
        const savedData = localStorage.getItem('vocabularyApp');
        if (savedData) {
            data = JSON.parse(savedData)
            console.log(data)
            vocabulary = data.vocabulary.map(word => {
                // Thêm isDifficult nếu chưa có
                if (!word.hasOwnProperty("isDifficult")) {
                    word.isDifficult = false;
                }
                return word;
            }); currentCardIndex = data.currentCardIndex || 0;

            // Ensure currentCardIndex is valid
            if (currentCardIndex >= vocabulary.length) {
                currentCardIndex = 0;
            }
        }
    } catch (e) {
        console.log('Không thể tải dữ liệu:', e);
        vocabulary = [];
        currentCardIndex = 0;
    }
}

// Load data on page load
window.onload = function () {
    loadData();
    updateFlashcard();
    updateWordList();
};

// Tab switching
function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');

    // Update content when switching tabs
    if (tabName === 'flashcard') {
        updateFlashcard();
    } else if (tabName === 'list') {
        updateWordList();
    }
}

function speak(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // hoặc 'en-US' nếu đọc tiếng Anh
        utterance.rate = 1;       // tốc độ đọc (0.1 -> 10)
        utterance.pitch = 1;      // tông giọng (0 -> 2)
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Trình duyệt không hỗ trợ đọc văn bản!");
    }
}


// Add word functionality
function addWord() {
    const englishWord = document.getElementById('english-word').value.trim();
    const vietnameseMeaning = document.getElementById('vietnamese-meaning').value.trim();

    if (!englishWord || !vietnameseMeaning) {
        alert('Vui lòng nhập đầy đủ từ tiếng Anh và nghĩa tiếng Việt!');
        return;
    }

    const newWord = {
        id: Date.now(),
        english: englishWord,
        vietnamese: vietnameseMeaning,
        dateAdded: new Date().toISOString(),
        isDifficult: false
    };

    vocabulary.push(newWord);
    saveData(); // Save to localStorage

    // Clear inputs
    document.getElementById('english-word').value = '';
    document.getElementById('vietnamese-meaning').value = '';

    updateFlashcard();
    updateWordList();
}

// Flashcard functionality
function updateFlashcard() {
    const counter = document.getElementById('word-counter');
    const cardFront = document.getElementById('card-front');
    const cardBack = document.getElementById('card-back');

    if (vocabulary.length === 0) {
        counter.textContent = 'Chưa có từ nào';
        cardFront.textContent = 'Thêm từ để bắt đầu học';
        cardBack.textContent = 'Nghĩa sẽ hiển thị ở đây';
        return;
    }

    // Ensure current index is valid
    if (currentCardIndex >= vocabulary.length) {
        currentCardIndex = 0;
    }

    const currentWord = vocabulary[currentCardIndex];
    counter.textContent = `Từ ${currentCardIndex + 1} / ${vocabulary.length}`;
    cardFront.textContent = currentWord.english;
    cardBack.textContent = currentWord.vietnamese;
    const flashcardTab = document.getElementById('flashcard-tab');

    if (vocabulary[currentCardIndex].isDifficult) {
        flashcardTab.style.backgroundColor = "#ffe0e0"; // đỏ nhạt
    } else {
        flashcardTab.style.backgroundColor = "#e0fbe0"; // xanh nhạt
    }
    // Reset flip state
    document.getElementById('flashcard').classList.remove('flipped');
    isCardFlipped = false;
    saveData()
}

function flipCard() {
    if (vocabulary.length === 0) return;

    const flashcard = document.getElementById('flashcard');
    flashcard.classList.toggle('flipped');
    isCardFlipped = !isCardFlipped;
}

function nextCard() {
    if (vocabulary.length === 0) return;

    currentCardIndex = (currentCardIndex + 1) % vocabulary.length;
    saveData(); // Save current position
    updateFlashcard();
}

function previousCard() {
    if (vocabulary.length === 0) return;

    currentCardIndex = currentCardIndex === 0 ? vocabulary.length - 1 : currentCardIndex - 1;
    saveData(); // Save current position
    updateFlashcard();
}

// Test functionality
function startTest() {
    const enToVi = document.getElementById('en-to-vi').checked;
    const viToEn = document.getElementById('vi-to-en').checked;
    const isDifficult = document.getElementById('diff').checked;


    if (!enToVi && !viToEn) {
        alert('Vui lòng chọn ít nhất một hướng dịch!');
        return;
    }

    // Filter words by date
    let filteredWords = vocabulary;
    if (!isDifficult) {
        const selectedDateInput = document.getElementById('selected-date');
        const selectedDateValue = selectedDateInput.value;

        if (selectedDateValue) {
            const selectedDate = new Date(selectedDateValue);
            selectedDate.setHours(0, 0, 0, 0); // chuẩn hóa về đầu ngày

            filteredWords = vocabulary.filter(word => {
                const wordDate = new Date(word.dateAdded);
                wordDate.setHours(0, 0, 0, 0); // chuẩn hóa về đầu ngày để so sánh chính xác
                return wordDate.getTime() === selectedDate.getTime();
            });
        }

        if (filteredWords.length === 0) {
            alert('Không có từ nào phù hợp với bộ lọc đã chọn!');
            return;
        }
    } else {
        filteredWords = vocabulary.filter(word => {
            return word.isDifficult === true;
        });
    }

    // Prepare test questions
    testWords = [];
    filteredWords.forEach(word => {
        if (enToVi) {
            testWords.push({
                question: word.english,
                answer: word.vietnamese,
                type: 'en-to-vi'
            });
        }
        if (viToEn) {
            testWords.push({
                question: word.vietnamese,
                answer: word.english,
                type: 'vi-to-en'
            });
        }
    });

    // Shuffle questions
    testWords = testWords.sort(() => Math.random() - 0.5);

    // Reset test state
    currentTestIndex = 0;
    testStats = { total: 0, correct: 0, wrong: 0 };

    // Show test UI
    document.getElementById('test-setup').style.display = 'none';
    document.getElementById('test-question').style.display = 'block';
    document.getElementById('test-stats').style.display = 'none';

    showNextQuestion();
}

function showNextQuestion() {
    if (currentTestIndex >= testWords.length) {
        showTestResults();
        return;
    }

    currentQuestion = testWords[currentTestIndex];
    document.getElementById('question-text').textContent = currentQuestion.question;
    document.getElementById('answer-input').value = '';
    document.getElementById('test-result').innerHTML = '';
    document.getElementById('answer-input').focus();
}

function checkAnswer() {
    const userAnswer = document.getElementById('answer-input').value.trim().toLowerCase();
    const correctAnswer = currentQuestion.answer.toLowerCase();
    const resultDiv = document.getElementById('test-result');

    testStats.total++;

    if (userAnswer === correctAnswer) {
        testStats.correct++;
        resultDiv.innerHTML = '<div class="correct">✅ Đúng rồi!</div>';
    } else {
        testStats.wrong++;
        resultDiv.innerHTML = `<div class="incorrect">❌ Sai rồi! Đáp án đúng: <strong>${currentQuestion.answer}</strong></div>`;
    }

    speak(currentQuestion.question);

    setTimeout(() => {
        currentTestIndex++;
        showNextQuestion();
    }, 2000);
}

function skipQuestion() {
    testStats.total++;
    testStats.wrong++;
    speak(currentQuestion.question);
    const resultDiv = document.getElementById('test-result');
    resultDiv.innerHTML = `<div class="incorrect">⏭️ Đã bỏ qua! Đáp án: <strong>${currentQuestion.answer}</strong></div>`;

    setTimeout(() => {
        currentTestIndex++;
        showNextQuestion();
    }, 1500);
}

function handleTestKeyPress(event) {
    if (event.key === 'Enter') {
        checkAnswer();
    }
}

function showTestResults() {
    document.getElementById('test-question').style.display = 'none';
    document.getElementById('test-stats').style.display = 'block';

    document.getElementById('total-questions').textContent = testStats.total;
    document.getElementById('correct-answers').textContent = testStats.correct;
    document.getElementById('wrong-answers').textContent = testStats.wrong;

    const accuracy = testStats.total > 0 ? Math.round((testStats.correct / testStats.total) * 100) : 0;
    document.getElementById('accuracy').textContent = accuracy + '%';
}

function resetTest() {
    document.getElementById('test-setup').style.display = 'block';
    document.getElementById('test-question').style.display = 'none';
    document.getElementById('test-stats').style.display = 'none';
}

// Word list functionality
function updateWordList() {
    const wordList = document.getElementById('word-list');

    if (vocabulary.length === 0) {
        wordList.innerHTML = '<p style="text-align: center; color: #666;">Chưa có từ nào. Hãy thêm từ mới!</p>';
        return;
    }

    // Sort by date added (newest first)
    const sortedWords = [...vocabulary].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

    wordList.innerHTML = sortedWords.map(word => `
                <div class="word-item">
                    <div class="word-info">
                        <div class="word-english">${word.english}</div>
                        <div class="word-vietnamese">${word.vietnamese}</div>
                        <div class="isDif">Khó: ${word.isDifficult}</div>

                    </div>
                    <div class="word-date">${new Date(word.dateAdded).toLocaleDateString('vi-VN')}</div>
                    <button class="btn-delete" onclick="deleteWord(${word.id})">🗑️</button>
                    <button class="btn-modify"  onclick="openEditModal(${word.id})">✏️</button>
                    
                </div>
            `).join('');
}

function deleteWord(id) {
    if (confirm('Bạn có chắc muốn xóa từ này?')) {
        vocabulary = vocabulary.filter(word => word.id !== id);
        saveData(); // Save to localStorage
        updateWordList();
        updateFlashcard();
    }
}


function openEditModal(id) {
    const word = vocabulary.find(w => w.id === id);
    if (word) {
        document.getElementById('edit-id').value = word.id;
        document.getElementById('edit-english').value = word.english;
        document.getElementById('edit-vietnamese').value = word.vietnamese;
        document.getElementById('edit-modal').classList.add('show');
    }
}

function saveEdit() {
    const id = parseInt(document.getElementById('edit-id').value);
    const english = document.getElementById('edit-english').value.trim();
    const vietnamese = document.getElementById('edit-vietnamese').value.trim();

    const index = vocabulary.findIndex(w => w.id === id);
    if (index !== -1) {
        vocabulary[index].english = english;
        vocabulary[index].vietnamese = vietnamese;
        updateFlashcard(); // cập nhật lại UI
        closeEditModal();
    }
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('show');
}






function clearAllData() {
    if (confirm('⚠️ Bạn có chắc muốn xóa TẤT CẢ dữ liệu? Hành động này không thể hoàn tác!')) {
        vocabulary = [];
        currentCardIndex = 0;
        localStorage.removeItem('vocabularyApp');
        updateWordList();
        updateFlashcard();
        alert('Đã xóa tất cả dữ liệu!');
    }
}

function exportData() {
    if (vocabulary.length === 0) {
        alert('Không có dữ liệu để xuất!');
        return;
    }

    const dataStr = JSON.stringify(vocabulary, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vocabulary_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                if (confirm('Bạn có muốn thay thế tất cả dữ liệu hiện tại không?')) {
                    vocabulary = importedData;
                } else {
                    vocabulary = [...vocabulary, ...importedData];
                }
                currentCardIndex = 0;
                saveData();
                updateWordList();
                updateFlashcard();
                alert('Nhập dữ liệu thành công!');
            } else {
                alert('File không đúng định dạng!');
            }
        } catch (error) {
            alert('Lỗi khi đọc file: ' + error.message);
        }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = '';
}

// Sync functionality
function generateShareLink() {
    if (vocabulary.length === 0) {
        alert('Không có dữ liệu để chia sẻ!');
        return;
    }

    // Create a unique ID for this share
    const shareId = 'vocab_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    const shareData = {
        id: shareId,
        data: vocabulary,
        timestamp: Date.now(),
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    // Store in localStorage with expiration
    localStorage.setItem('share_' + shareId, JSON.stringify(shareData));

    // Create shareable URL
    const baseUrl = window.location.href.split('?')[0];
    const shareUrl = baseUrl + '?sync=' + shareId;

    document.getElementById('share-link').value = shareUrl;
    document.getElementById('share-link-section').style.display = 'block';
    document.getElementById('qr-code-section').style.display = 'none';
    document.getElementById('sync-input-section').style.display = 'none';
}

function showQRCode() {
    if (vocabulary.length === 0) {
        alert('Không có dữ liệu để chia sẻ!');
        return;
    }

    // Generate share link first
    generateShareLink();
    const shareUrl = document.getElementById('share-link').value;

    // Create QR code using a simple QR code generator
    const qrContainer = document.getElementById('qr-code-container');
    qrContainer.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 10px; border: 2px solid #ddd;">
                    <div style="text-align: center;">
                        <div id="qr-code-canvas" style="margin: 0 auto;"></div>
                        <p style="margin-top: 10px; font-size: 12px; color: #666;">Quét bằng camera điện thoại</p>
                    </div>
                </div>
            `;

    // Generate QR code using QR Server API
    const qrImg = document.createElement('img');
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
    qrImg.style.display = 'block';
    qrImg.style.margin = '0 auto';
    document.getElementById('qr-code-canvas').appendChild(qrImg);

    document.getElementById('qr-code-section').style.display = 'block';
    document.getElementById('share-link-section').style.display = 'none';
    document.getElementById('sync-input-section').style.display = 'none';
}

function showSyncInput() {
    document.getElementById('sync-input-section').style.display = 'block';
    document.getElementById('share-link-section').style.display = 'none';
    document.getElementById('qr-code-section').style.display = 'none';
    document.getElementById('sync-link-input').value = '';
    document.getElementById('sync-link-input').focus();
}

function hideSyncInput() {
    document.getElementById('sync-input-section').style.display = 'none';
}

function copyShareLink() {
    const shareLink = document.getElementById('share-link');
    shareLink.select();
    shareLink.setSelectionRange(0, 99999);

    try {
        document.execCommand('copy');
        alert('Đã sao chép link! Gửi link này cho thiết bị khác để đồng bộ.');
    } catch (err) {
        // Fallback for mobile
        navigator.clipboard.writeText(shareLink.value).then(() => {
            alert('Đã sao chép link! Gửi link này cho thiết bị khác để đồng bộ.');
        }).catch(() => {
            alert('Không thể sao chép tự động. Vui lòng sao chép link thủ công.');
        });
    }
}

function syncFromLink() {
    const syncUrl = document.getElementById('sync-link-input').value.trim();

    if (!syncUrl) {
        alert('Vui lòng nhập link đồng bộ!');
        return;
    }

    // Extract share ID from URL
    const urlParams = new URLSearchParams(syncUrl.split('?')[1]);
    const shareId = urlParams.get('sync');

    if (!shareId) {
        alert('Link không hợp lệ!');
        return;
    }

    // Try to get data from localStorage first (same device)
    const localShareData = localStorage.getItem('share_' + shareId);
    if (localShareData) {
        try {
            const shareData = JSON.parse(localShareData);

            // Check if expired
            if (Date.now() > shareData.expires) {
                alert('Link đã hết hạn!');
                return;
            }

            // Sync data
            if (confirm('Bạn có muốn thay thế tất cả dữ liệu hiện tại không?')) {
                vocabulary = shareData.data;
            } else {
                vocabulary = [...vocabulary, ...shareData.data];
            }

            currentCardIndex = 0;
            saveData();
            updateWordList();
            updateFlashcard();
            hideSyncInput();
            alert('Đồng bộ thành công!');

        } catch (error) {
            alert('Lỗi khi đồng bộ: ' + error.message);
        }
    } else {
        alert('Không tìm thấy dữ liệu đồng bộ. Đảm bảo bạn đang sử dụng link từ cùng một trình duyệt hoặc thiết bị đã tạo link.');
    }
}

// Check for sync parameter on page load
function checkSyncOnLoad() {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('sync');

    if (shareId) {
        // Auto-show sync input and fill the current URL
        showTab('list');
        setTimeout(() => {
            showSyncInput();
            document.getElementById('sync-link-input').value = window.location.href;

            if (confirm('Phát hiện link đồng bộ. Bạn có muốn đồng bộ dữ liệu ngay không?')) {
                syncFromLink();
            }
        }, 500);
    }
}

// Update window.onload to include sync check
window.onload = function () {
    loadData();
    updateFlashcard();
    updateWordList();
    checkSyncOnLoad();
};

function modifyDiff() {
    console.log(currentQuestion)
    console.log(vocabulary)

    const word = vocabulary.find(w => w.english === currentQuestion.question);
    if (word) {
        word.isDifficult = !word.isDifficult;
    }
}

function modifyDifficultForCard() {
    const word = vocabulary.find(w => w.english === vocabulary[currentCardIndex].english);
    if (word) {
        word.isDifficult = !word.isDifficult;
    }
    updateFlashcard()
}