$(document).ready(function() {
  // 버튼 추가
  $('#memo-container').append(`
    <div class="btn-group" style="display: flex; justify-content: center; margin-top: 10px;">
      <button id="select-rune-category-button" class="btn btn-primary">룬 이미지 선택</button>
      <button id="select-item-category-button" class="btn btn-primary">아이템 이미지 선택</button>
    </div>
  `);

  // 데이터 드래곤 버전 설정 (예시용으로 가장 최신 버전 가져오기)
  fetchDataDragonVersion().then(latestVersion => {
    window.version = latestVersion;

    // 룬 카테고리 버튼 이벤트 추가
    $('#select-rune-category-button').on('click', function() {
      displayCategorySelectionModal('룬 카테고리 선택', 'rune');
    });

    // 아이템 카테고리 버튼 이벤트 추가
    $('#select-item-category-button').on('click', function() {
      displayCategorySelectionModal('아이템 카테고리 선택', 'item');
    });
  });
});

// 카테고리 선택 모달 표시 함수
function displayCategorySelectionModal(title, category) {
  const modal = $('<div>', { class: 'modal', id: 'category-selection-modal' });
  const modalContent = $('<div>', { class: 'modal-content', css: { display: 'flex', flexDirection: 'column', alignItems: 'center' } });

  const closeButton = $('<button>', {
    text: '닫기',
    click: () => modal.remove(),
    css: { marginBottom: '10px' }
  });

  const modalTitle = $('<h2>', { text: title });
  const categoryListDiv = $('<div>', { id: 'category-list', css: { marginTop: '20px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap' } });

  // 카테고리 로드
  if (category === 'rune') {
    loadRuneCategories(categoryListDiv);
  } else if (category === 'item') {
    loadItemCategories(categoryListDiv);
  }

  modalContent.append(closeButton, modalTitle, categoryListDiv);
  modal.append(modalContent);
  $('body').append(modal);
  modal.show();
}

// 룬 카테고리 로드 함수
function loadRuneCategories(container) {
  const apiUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/runesReforged.json`;

  $.ajax({
    url: apiUrl,
    method: 'GET',
    success: function(data) {
      data.forEach(tree => {
        const categoryButton = $('<button>', {
          text: tree.name,
          css: { margin: '10px', padding: '10px', cursor: 'pointer' },
          click: function() {
            $('#category-selection-modal').remove();
            displayImageSelectionModal(tree.name, tree);
          }
        });
        container.append(categoryButton);
      });
    },
    error: function(error) {
      console.error('룬 카테고리를 불러오는 중 오류 발생:', error);
    }
  });
}

// 아이템 카테고리 로드 함수
function loadItemCategories(container) {
  const categories = ["공격력", "방어력", "마법", "기타"];

  categories.forEach(category => {
    const categoryButton = $('<button>', {
      text: category,
      css: { margin: '10px', padding: '10px', cursor: 'pointer' },
      click: function() {
        $('#category-selection-modal').remove();
        displayItemSelectionModal(category);
      }
    });
    container.append(categoryButton);
  });
}

// 아이템 선택 모달 표시 함수
function displayItemSelectionModal(category) {
  const modal = $('<div>', { class: 'modal', id: 'item-selection-modal' });
  const modalContent = $('<div>', { class: 'modal-content', css: { display: 'flex', flexDirection: 'column', alignItems: 'center' } });

  const closeButton = $('<button>', {
    text: '닫기',
    click: () => modal.remove(),
    css: { marginBottom: '10px' }
  });

  const modalTitle = $('<h2>', { text: `${category} 아이템 선택` });
  const itemListDiv = $('<div>', { id: 'item-list', css: { marginTop: '20px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap' } });

  // 아이템 리스트 로드
  loadItemsByCategory(category, itemListDiv);

  modalContent.append(closeButton, modalTitle, itemListDiv);
  modal.append(modalContent);
  $('body').append(modal);
  modal.show();
}

// 아이템 카테고리에 따른 아이템 로드 함수
function loadItemsByCategory(category, container) {
    const apiUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/item.json`;

    $.ajax({
        url: apiUrl,
        method: 'GET',
        success: function(data) {
            const items = data.data;
            for (const itemId in items) {
                const item = items[itemId];
                if (isItemInCategory(item, category)) {
                    const itemButton = $('<button>', {
                        css: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', cursor: 'pointer' },
                        click: function() {
                            // 아이템 클릭 시 일반 메모 에디터에 삽입
                            insertItemEmbedToMemoEditor(item.name, item.image.full);
                            $('#item-selection-modal').remove(); // 모달 닫기
                        }
                    });

                    const itemImg = $('<img>', {
                        src: `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image.full}`,
                        alt: item.name,
                        css: { width: '80px', height: '80px', objectFit: 'cover', marginBottom: '5px' }
                    });
                    itemButton.append(itemImg);

                    const itemName = $('<span>', { text: item.name });
                    itemButton.append(itemName);

                    container.append(itemButton);
                }
            }
        },
        error: function(error) {
            console.error('아이템 데이터를 불러오는 중 오류 발생:', error);
        }
    });
}

// 아이템을 일반 메모 에디터에 삽입하는 함수
function insertItemEmbedToMemoEditor(name, image) {
    const embedCode = `<img src="https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${image}" alt="${name}" width="64" height="64" style="object-fit: cover; border-radius: 4px; overflow: hidden;">`;
    $('#editor').summernote('editor.pasteHTML', embedCode); // 일반 메모 에디터에 삽입
}


// 아이템이 해당 카테고리에 속하는지 확인하는 함수
function isItemInCategory(item, category) {
  const tags = item.tags;
  switch (category) {
    case "공격력":
      return tags.includes("Damage");
    case "방어력":
      return tags.includes("Armor") || tags.includes("Health") || tags.includes("SpellBlock");
    case "마법":
      return tags.includes("SpellDamage");
    case "기타":
      return !tags.includes("Damage") && !tags.includes("Armor") && !tags.includes("Health") && !tags.includes("SpellBlock") && !tags.includes("SpellDamage");
    default:
      return false;
  }
}

// 이미지 선택 모달 표시 함수
function displayImageSelectionModal(title, data) {
  const modal = $('<div>', { class: 'modal', id: 'image-selection-modal' });
  const modalContent = $('<div>', { class: 'modal-content', css: { display: 'flex', flexDirection: 'column', alignItems: 'center' } });

  const closeButton = $('<button>', {
    text: '닫기',
    click: () => modal.remove(),
    css: { marginBottom: '10px' }
  });

  const modalTitle = $('<h2>', { text: title });
  const imageListDiv = $('<div>', { id: 'image-list', css: { marginTop: '20px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap' } });

  // 이미지 리스트 로드
  if (data.slots) {
    loadRunes(data, imageListDiv);
  } else {
    loadItems(data, imageListDiv);
  }

  modalContent.append(closeButton, modalTitle, imageListDiv);
  modal.append(modalContent);
  $('body').append(modal);
  modal.show();
}

// 룬 이미지 로드 함수
// 이미지 선택 모달에서 이미지 버튼 생성 부분 수정
// 이미지 선택 모달에서 이미지 버튼 생성 부분 수정
// 룬 이미지 선택 모달에서 룬 이미지를 일반 메모 에디터에 삽입
function loadRunes(tree, container) {
    tree.slots.forEach(slot => {
        slot.runes.forEach(rune => {
            const runeButton = $('<button>', {
                css: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', cursor: 'pointer' },
                click: function() {
                    // 이미지 클릭 시 일반 메모 에디터에 삽입
                    insertRuneEmbedToMemoEditor(rune.name, rune.icon);
                    $('#image-selection-modal').remove(); // 모달 닫기
                }
            });

            const runeImg = $('<img>', {
                src: `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`,
                alt: rune.name,
                css: { width: '80px', height: '80px', objectFit: 'cover', marginBottom: '5px' }
            });
            runeButton.append(runeImg);

            const runeName = $('<span>', { text: rune.name });
            runeButton.append(runeName);

            container.append(runeButton);
        });
    });
}

// 아이템 이미지 선택 모달에서 아이템 이미지를 일반 메모 에디터에 삽입
function loadItems(item, container) {
    const itemButton = $('<button>', {
        css: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', cursor: 'pointer' },
        click: function() {
            // 아이템 클릭 시 일반 메모 에디터에 삽입
            insertItemEmbedToMemoEditor(item.name, item.image.full);
            $('#image-selection-modal').remove(); // 모달 닫기
        }
    });

    const itemImg = $('<img>', {
        src: `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image.full}`,
        alt: item.name,
        css: { width: '80px', height: '80px', objectFit: 'cover', marginBottom: '5px' }
    });
    itemButton.append(itemImg);

    const itemName = $('<span>', { text: item.name });
    itemButton.append(itemName);

    container.append(itemButton);
}

// 룬을 일반 메모 에디터에 삽입하는 함수
function insertRuneEmbedToMemoEditor(name, image) {
    const embedCode = `<img src="https://ddragon.leagueoflegends.com/cdn/img/${image}" alt="${name}" width="64" height="64" style="object-fit: cover; border-radius: 4px; overflow: hidden;">`;
    $('#editor').summernote('editor.pasteHTML', embedCode); // 일반 메모 에디터에 삽입
}



// 데이터 드래곤 버전 설정 함수
function fetchDataDragonVersion() {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: 'https://ddragon.leagueoflegends.com/api/versions.json',
      method: 'GET',
      success: function(versions) {
        resolve(versions[0]);
      },
      error: function(error) {
        console.error('버전 정보를 불러오는 중 오류 발생:', error);
        reject(error);
      }
    });
  });
}