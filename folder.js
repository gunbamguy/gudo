// folder.js
// folder.js

let directoryHandle = null;

// 요소 존재 여부 확인 후 이벤트 리스너 추가
const setFolderButton = document.getElementById('set-folder-button');
const openFolderButton = document.getElementById('open-folder-button');
const loadDefaultButton = document.getElementById('load-default-button');

if (setFolderButton) {
    setFolderButton.addEventListener('click', setFolder);
}

if (openFolderButton) {
    openFolderButton.addEventListener('click', openFolder);
}

if (loadDefaultButton) {
    loadDefaultButton.addEventListener('click', loadDefault);
}

// 폴더 설정 함수
function setFolder() {
    // 폴더 설정 로직
    console.log('폴더 설정 버튼 클릭됨');
}

// 폴더 열기 함수
function openFolder() {
    // 폴더 열기 로직
    console.log('폴더 열기 버튼 클릭됨');
}

// 기본값 로드 함수
function loadDefault() {
    // 기본값 로드 로직
    console.log('기본값 로드 버튼 클릭됨');
}

// ... (나머지 folder.js 내용 동일하게 유지)

async function setFolder() {
    try {
        directoryHandle = await window.showDirectoryPicker();
        alert('폴더가 설정되었습니다.');
    } catch (err) {
        console.error('폴더 설정 실패:', err);
    }
}

async function openFolder() {
    if (!directoryHandle) {
        alert('먼저 폴더를 설정해주세요.');
        return;
    }

    const entries = [];
    for await (const [name, handle] of directoryHandle.entries()) {
        if (handle.kind === 'file' && name.endsWith('.txt')) {
            entries.push({ name, handle });
        }
    }

    if (entries.length === 0) {
        alert('폴더에 txt 파일이 없습니다.');
        return;
    }

    showFileListModal(entries);
}

// loadDefault 함수 수정하여 기본 데이터를 불러올 때도 메모 포함
async function loadDefault() {
    if (!directoryHandle) {
        alert('먼저 폴더를 설정해주세요.');
        return;
    }

    try {
        const fileHandle = await directoryHandle.getFileHandle('default.txt');
        const file = await fileHandle.getFile();
        const content = await file.text();

        loadDataFromContent(content);

    } catch (err) {
        console.error('default.txt 불러오기 실패:', err);
        alert('default.txt 파일을 불러오는데 실패했습니다.');
    }
}


function loadDataFromContent(content) {
    loadDataFromBase64(content);
}

function showFileListModal(entries) {
    // 모달 생성
    const modal = $('<div>', { class: 'modal', id: 'file-list-modal' });
    const modalContent = $('<div>', { class: 'modal-content' });

    const closeButton = $('<button>', {
        text: '닫기',
        click: () => modal.remove(),
        css: { marginBottom: '10px' }
    });

    const fileList = $('<ul>', { css: { listStyleType: 'none', padding: '0' } });
    entries.forEach(entry => {
        const listItem = $('<li>', {
            text: entry.name,
            css: {
                padding: '10px',
                borderBottom: '1px solid #ddd',
                cursor: 'pointer'
            },
            hover: function() {
                $(this).css('background-color', '#f0f0f0');
            },
            mouseleave: function() {
                $(this).css('background-color', '');
            },
            click: () => {
                modal.remove();
                loadFile(entry.handle);
            }
        });
        fileList.append(listItem);
    });

    modalContent.append(closeButton, fileList);
    modal.append(modalContent);
    $('body').append(modal);
    modal.show();
}

async function loadFile(fileHandle) {
    try {
        const file = await fileHandle.getFile();
        const content = await file.text();
        loadDataFromContent(content);
    } catch (err) {
        console.error('파일 불러오기 실패:', err);
        alert('파일을 불러오는데 실패했습니다.');
    }
}
