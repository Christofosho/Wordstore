/*
  Wordstore
  Copyright (c) 2022 Christopher Snow

  Store and search words and phrases to help
  you keep track of what you need to know.

  This program is free software: you can redistribute it
  and/or modify it under the terms of the GNU General Public
  License as published by the Free Software Foundation,
  either version 3 of the License, or (at your option) any
  later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public
  License along with this program. If not,
  see <https://www.gnu.org/licenses/>.
*/

const BodyTop = document.querySelector(".popup-body__top");
const BodyContent = document.querySelector(".popup-body__content");
const BodyBottom = document.querySelector(".popup-body__bottom");
const WordInput = document.querySelector(".word__new");
const AddButton = document.querySelector(".add");
const SearchInput = document.querySelector(".popup-search__input");
const SearchFilter = document.querySelector(".popup-search__select");
const CsvExportButton = document.querySelector(".csv-export-button");
const DropdownButton = document.querySelector("#popup-dropdown__button");

const WORD_INDEX = 0;
const ADDED_INDEX = 1;

let page = 1;

// Support for Chrome browser object.
const browser = window.chrome ? chrome : browser;

// Adds a string to storage.local (different from localStorage).
const addWord = async event => {
  const word = WordInput.value.trim();

  if (word === "") {
    return;
  }

  if (word.length > 1024) {
    return;
  }

  const wordstore = await getStore();

  if (wordstore[word.toLowerCase()]) {
    return;
  }

  browser.storage.local
    .set({ "wordstore": {
      ...wordstore,
      [word.toLowerCase()]: [word, +new Date]
    }}, populateBody);

  WordInput.value = "";
  WordInput.focus();
};

// Adds a string to storage.local
// Triggered by keypress, accepts only "Enter"
const addOnEnter = event => {
  event.stopPropagation();

  if (event.code === "Enter" || event.code === "NumpadEnter") {
    addWord(event);
  }
};

// Removes a string from storage.local
const removeWord = async event => {
  const wordstore = await getStore();

  if (Object.keys(wordstore).includes(event.target.value)) {
    delete wordstore[event.target.value];
    browser.storage.local.set({ "wordstore": wordstore }, populateBody);
  }
};

const copyWord = event => {
  navigator.clipboard.writeText(event.target.value);
};

const loadNextPage = async event => {
  const wordstore = await getStore();

  if (page < Object.keys(wordstore).length) {
    ++page;
    populateBody();
  }
};

const loadPrevPage = event => {
  if (page > 1) {
    --page;
    populateBody();
  }
};

// Adds pagination as the next child of the provided element
const appendPagination = (parent, rowCount) => {

  // Remove old pagination
  while (parent.lastChild) {
    parent.removeChild(parent.lastChild);
  }

  // Do not draw pagination with 0 words
  if (rowCount === 0) return;

  const pageCount = Math.ceil(rowCount / 10);

  const pagination = document.createElement("div");
  pagination.classList.add("flex");
  pagination.classList.add("pagination");

  // Add "Prev" button if not on first page
  const prev = document.createElement("div");
  prev.classList.add("pagination__button");
  prev.textContent = "←";
  if (page > 1) {
    prev.classList.add("pagination__button--active");
    prev.onclick = loadPrevPage;
  }

  pagination.appendChild(prev);

  const curr = document.createElement("div");
  curr.classList.add("pagination__page");
  curr.classList.add("text-center");
  curr.title = `Total stored: ${rowCount}`;
  curr.textContent = `${page} of ${pageCount}`;
  pagination.appendChild(curr);

  // Add "Next" button if not on the last page

  const next = document.createElement("div");
  next.classList.add("pagination__button");
  next.textContent = "→";
  if (page < pageCount) {
    next.classList.add("pagination__button--active");
    next.onclick = loadNextPage;
  }

  pagination.appendChild(next);

  parent.appendChild(pagination);
};

// Clears #popup-body children, and adds one
// new row for each stored string within storage.local.
const populateBody = async () => {
  const wordstore = await getStore();
  let _words = Object.keys(wordstore);

  /* Remove content */

  while (BodyContent.lastChild) {
    BodyContent.removeChild(BodyContent.lastChild);
  }

  /* Add top pagination */

  appendPagination(BodyTop, _words.length);

  /* Add stored content */
  const _page = page * 10;
  _words.slice(_page - 10, _page)
  .forEach((word_row, index) => {

    // Filter out if no match
    if (shouldfilterWord(word_row, SearchInput.value)) return;

    const WordContainer = document.createElement("div");
    WordContainer.classList.add("word-container");
    WordContainer.title = wordstore[word_row][WORD_INDEX];

    const Word = document.createElement("span");
    Word.id = `word-${index}-text`;
    Word.dataset.text = word_row.toLowerCase();
    Word.classList.add("word");
    Word.textContent = wordstore[word_row][WORD_INDEX];
    Word.addEventListener("click", enableWordEdit);

    WordContainer.appendChild(Word);

    const WordEdit = document.createElement("input");
    WordEdit.type = "text";
    WordEdit.id = `word-${index}-input`;
    WordEdit.value = wordstore[word_row][WORD_INDEX];
    WordEdit.classList.add("word");
    WordEdit.classList.add("hide");
    WordEdit.addEventListener("blur", disableWordEdit);
    WordEdit.addEventListener("keyup", disableWordEdit);

    WordContainer.appendChild(WordEdit);

    const CopyButton = document.createElement("button");
    CopyButton.classList.add("copy");
    CopyButton.classList.add("padded-border");
    CopyButton.textContent = "Copy";
    CopyButton.value = wordstore[word_row][WORD_INDEX];
    CopyButton.onclick = copyWord;

    WordContainer.appendChild(CopyButton);

    const RemoveButton = document.createElement("button");
    RemoveButton.classList.add("remove");
    RemoveButton.classList.add("padded-border");
    RemoveButton.textContent = "Remove";
    RemoveButton.value = word_row;
    RemoveButton.onclick = removeWord;

    WordContainer.appendChild(RemoveButton);

    // .popup-body
    //   .body-top
    //   .body-content
    //     .word-container
    //         .word
    //         .copy
    //         .remove
    //   .body-bottom
    BodyContent.appendChild(WordContainer);
  });

  // Add disclaimer if empty
  if (_words.length === 0) {
    const EmptyDescriptionElement = document.createElement("div");
    EmptyDescriptionElement.classList.add("text-center");
    EmptyDescriptionElement.classList.add("no-words-stored");
    EmptyDescriptionElement.textContent = "There are no words currently stored.";
    BodyContent.appendChild(EmptyDescriptionElement);
  }

  appendPagination(BodyBottom, _words.length);
};

// Compares two strings based on filter type.
// Filtering is case-insensitive.
// Filter types include:
//   - "Contains"
//   - "Starts with"
//   - "Ends with"
const shouldfilterWord = (word, filter) => {
  const filterType = SearchFilter.value;
  const lowerWord = word.toLowerCase();
  const lowerFilter = filter.toLowerCase();
  switch (filterType) {
    case "contains":
      return !lowerWord.includes(lowerFilter);

    case "starts":
      return lowerWord.substring(0, filter.length) !== lowerFilter;

    case "ends":
      return lowerWord.substring(word.length - filter.length) !== lowerFilter;

    default:
      return false;
  }
};

const generateCsv = async event => {
  const wordstore = await getStore();
  const _words = Object.values(wordstore);
  if (_words.length) {
    const _csv = "word,modified\n"
    + Object.values(wordstore).map(word => {
      word[ADDED_INDEX] = (new Date(word[ADDED_INDEX])).toISOString();
      return `${word.join(",")}`;
    }).join("\n");

    const hiddenElement = document.createElement("a");
    hiddenElement.href = "data:text/csv;charset=utf-8," + encodeURI(_csv);
    hiddenElement.target = "_blank";
    hiddenElement.download = "wordstore.csv";
    hiddenElement.click();
    hiddenElement.remove();
  }
};

const toggleDropdown = () => {
  document
    .getElementById("popup-dropdown__content")
    .classList.toggle("show-flex");
};

const enableWordEdit = event => {
  const word = event.target.id.match(/^word-(.+)-text$/);
  if (word.length) {
    const EditableWord = document.getElementById(`word-${word[1]}-input`);
    if (EditableWord) {
      event.target.classList.add("hide");
      EditableWord.classList.remove("hide");
      EditableWord.focus();
    }
  }
};

const disableWordEdit = async event => {
  if (event.type === "keyup" && event.key !== "Enter") {
    return;
  }

  const wordIndex = event.target.id.match(/^word-(.+)-input$/);
  if (wordIndex.length) {
    const TextWord = document.getElementById(`word-${wordIndex[1]}-text`);
    const wordstore = await getStore();

    // Save the new content unless it is unchanged or
    // it exists already (in which case, reset it).
    if (wordstore[event.target.value.toLowerCase()]) {
      populateBody();
    }
    else {
      delete wordstore[TextWord.dataset.text];
      browser.storage.local
      .set({ "wordstore": {
        ...wordstore,
        [event.target.value.toLowerCase()]: [event.target.value, +new Date]
      }}, populateBody);
    }

    // Swap the input with the plain text
    event.target.classList.add("hide");
    TextWord.classList.remove("hide");
  }
};

// Words are stored in the storage key "wordstore".
// Word row contents:
//   word, modified
const getStore = () => new Promise(resolve => browser.storage.local.get("wordstore", wordstore => {
  if (wordstore.wordstore) {
    resolve(wordstore.wordstore);
  }
  else {
    resolve({});
  }
}));

const fixV1Data = async () => {
  const wordstore = await getStore();
  const _words = Object.keys(wordstore);
  if (_words.length) {
    // Check if values are strings, and replace with new [word, date] pattern.
    if (typeof wordstore[_words[0]] === "string") {
      const added = +new Date;
      for (const key of _words) {
        wordstore[key] = [wordstore[key], added];
      }
      chrome.storage.local.set({ "wordstore": wordstore }, populateBody);
    }
  }
};

// Adds event listeners to DOM elements.
const addEventListeners = () => {
  WordInput.addEventListener("keydown", addOnEnter);
  AddButton.addEventListener("click", addWord);
  SearchInput.addEventListener("keyup", populateBody);
  SearchFilter.addEventListener("change", populateBody);
  CsvExportButton.addEventListener("click", generateCsv);
  DropdownButton.addEventListener("click", toggleDropdown);
};

document.addEventListener("DOMContentLoaded", () => {

  // Backward compatibility for wordstore rows constructed like: {word.toLowerCase(): "word"}
  fixV1Data();

  populateBody();
  addEventListeners();

  SearchInput.focus();
});