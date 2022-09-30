/*
  WordStore

  Store and search words and phrases to help
  you keep track of what you need to know.

  copyright © 2022 Christopher Snow
*/

const WordInput = document.getElementById("word__new");
const AddButton = document.getElementById("add");
const SearchInput = document.getElementById("popup-search__input");
const SearchFilter = document.getElementById("popup-search__select");

let page = 1;

// Adds a string to storage.local (different from localStorage).
const addWord = event => {
  browser.storage.local.get()
    .then(wordstore => {

      if (WordInput.value === "") {
        return;
      }

      if (WordInput.value.length > 128) {
        return;
      }

      const word = WordInput.value.trim();

      if (wordstore[word.toLowerCase()]) {
        return;
      }

      wordstore[word.toLowerCase()] = word;

      browser.storage.local
        .set(wordstore)
        .then(populateBody);

      WordInput.value = "";
      WordInput.focus();
    });
};

// Adds a string to storage.local
// Triggered by keypress, accepts only "Enter"
const addOnEnter = event => {
  event.stopPropagation();

  if (event.code !== "Enter") return;

  addWord(event);
};

// Removes a string from storage.local
const removeWord = event => {
  browser.storage.local
    .remove(event.target.value)
    .then(populateBody);
};

const loadNextPage = event => {
  browser.storage.local.get()
    .then(wordstore => {
      if (page < Object.keys(wordstore).length) {
        ++page;
        populateBody();
      }
    });
};

const loadPrevPage = event => {
  if (page > 1) {
    --page;
    populateBody();
  }
};

// Adds pagination as the next child of the provided element
const appendPagination = (parent, rowCount) => {
  if (rowCount < 11) return;

  const pageCount = Math.ceil(rowCount / 10);

  const pagination = document.createElement("div");
  pagination.className = "flex pagination";

  // Add "Prev" button if not on first page
  const prev = document.createElement("div");
  prev.className = "pagination__button";
  prev.textContent = "<";
  if (page > 1) {
    prev.onclick = loadPrevPage;
  }

  pagination.appendChild(prev);

  const curr = document.createElement("div");
  curr.className = "pagination__button";
  curr.textContent = page;
  pagination.appendChild(curr);

  // Add "Next" button if not on the last page

  const next = document.createElement("div");
  next.className = "pagination__button";
  next.textContent = ">";
  if (page < pageCount) {
    next.onclick = loadNextPage;
  }

  pagination.appendChild(next);

  parent.appendChild(pagination);
};

// Clears #popup-body children, and adds one
// new row for each stored string within storage.local.
const populateBody = () => {
  browser.storage.local.get()
    .then(wordstore => {

      let _words = Object.keys(wordstore);

      /* Remove content */

      const Body = document.getElementById("popup-body");
      while (Body.lastChild) {
        Body.removeChild(Body.lastChild);
      }

      /* Add top pagination */

      appendPagination(Body, _words.length);

      /* Add stored content */
      const _page = page * 10;
      _words.slice(_page - 10, _page)
      .forEach(word => {

        // Filter out if no match
        if (shouldfilterWord(word, SearchInput.value)) return;

        const WordRow = document.createElement("div");
        WordRow.className = "flex word-row";

        const WordElement = document.createElement("div");
        WordElement.className = "word";
        WordElement.textContent = wordstore[word];

        const RemoveButton = document.createElement("button");
        RemoveButton.className = "remove";
        RemoveButton.textContent = "Remove";
        RemoveButton.value = word;
        RemoveButton.onclick = removeWord;

        // #popup-body
        //     .word-row
        //         .word
        //         .remove
        WordRow.appendChild(WordElement);
        WordRow.appendChild(RemoveButton);
        Body.appendChild(WordRow);
      });

      // Add disclaimer if empty
      if (_words.length === 0) {
        const EmptyDescriptionElement = document.createElement("div");
        EmptyDescriptionElement.className = "text-center";
        EmptyDescriptionElement.textContent = "There are no words currently stored.";
        Body.appendChild(EmptyDescriptionElement);
      }
    });
};

// Compares two strings based on filter type.
// Filter types include:
//   - "Contains"
//   - "Starts with"
//   - "Ends with"
const shouldfilterWord = (word, filter) => {
  const filterType = SearchFilter.value;
  switch (filterType) {
    case "contains":
      return !word.includes(filter);

    case "starts":
      return word.substring(0, filter.length) !== filter;

    case "ends":
      return word.substring(word.length - filter.length) !== filter;

    default:
      return false;
  }
};

// Adds event listeners to DOM elements.
const addEventListeners = () => {
  WordInput.onkeydown = addOnEnter;
  AddButton.onclick = addWord;
  SearchInput.onkeyup = populateBody;
  SearchFilter.onchange = populateBody;
};

document.addEventListener("DOMContentLoaded", () => {
  populateBody();
  addEventListeners();
});