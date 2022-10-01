/*
  Wordstore

  Store and search words and phrases to help
  you keep track of what you need to know.

  copyright © 2022 Christopher Snow
*/

const BodyTop = document.querySelector(".popup-body__top");
const BodyContent = document.querySelector(".popup-body__content");
const BodyBottom = document.querySelector(".popup-body__bottom");
const WordInput = document.querySelector(".word__new");
const AddButton = document.querySelector(".add");
const SearchInput = document.querySelector(".popup-search__input");
const SearchFilter = document.querySelector(".popup-search__select");

let page = 1;

// Adds a string to storage.local (different from localStorage).
const addWord = event => {
  if (WordInput.value === "") {
    return;
  }

  if (WordInput.value.length > 1024) {
    return;
  }

  browser.storage.local.get()
    .then(wordstore => {

      const word = WordInput.value.trim();

      if (wordstore[word.toLowerCase()]) {
        return;
      }

      browser.storage.local
        .set({ [word.toLowerCase()]: word })
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

const copyWord = event => {
  navigator.clipboard.writeText(event.target.value);
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
const populateBody = () => {
  browser.storage.local.get()
    .then(wordstore => {

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
      .forEach(word => {

        // Filter out if no match
        if (shouldfilterWord(word, SearchInput.value)) return;

        const WordRow = document.createElement("div");
        WordRow.classList.add("flex");
        WordRow.classList.add("word-row");

        const WordContainer = document.createElement("div");
        WordContainer.classList.add("word-container");
        WordContainer.title = wordstore[word];

        const Word = document.createElement("span");
        Word.classList.add("word");
        Word.textContent = wordstore[word];

        WordContainer.appendChild(Word);

        const CopyButton = document.createElement("button");
        CopyButton.classList.add("copy");
        CopyButton.classList.add("padded-border");
        CopyButton.textContent = "Copy";
        CopyButton.value = wordstore[word];
        CopyButton.onclick = copyWord;

        WordContainer.appendChild(CopyButton);

        const RemoveButton = document.createElement("button");
        RemoveButton.classList.add("remove");
        RemoveButton.classList.add("padded-border");
        RemoveButton.textContent = "Remove";
        RemoveButton.value = word;
        RemoveButton.onclick = removeWord;

        WordContainer.appendChild(RemoveButton);

        // .popup-body
        //   .body-top
        //   .body-content
        //     .word-row
        //         .word
        //         .remove
        //   .body-bottom
        WordRow.appendChild(WordContainer);
        BodyContent.appendChild(WordRow);
      });

      // Add disclaimer if empty
      if (_words.length === 0) {
        const EmptyDescriptionElement = document.createElement("div");
        EmptyDescriptionElement.classList.add("text-center");
        EmptyDescriptionElement.textContent = "There are no words currently stored.";
        BodyContent.appendChild(EmptyDescriptionElement);
      }

      appendPagination(BodyBottom, _words.length);
    });
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

  SearchInput.focus();
});