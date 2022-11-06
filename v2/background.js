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

// Support for Chrome browser object.
const browser = window.chrome ? chrome : browser;

browser.contextMenus.create({
  id: "add-single-word",
  title: browser.i18n.getMessage("menuItemAddSingleWord"),
  contexts: ["selection"]
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "add-single-word":
      saveWord(info.selectionText);
      break;
  }
});

const saveWord = async word => {
  const selectedText = word.trim();

  // Do not save empty strings.
  if (selectedText === "") {
    return;
  }

  // Do not save exceedingly long words / phrases.
  if (selectedText.length > 128) {
    return;
  }

  // Get our existing wordstore.
  const wordstore = await getStore();

  // Do not add the same word twice!
  if (wordstore[selectedText.toLowerCase()]) {
    return;
  }

  // Save our new highlighted word.
  browser.storage.local.set({ "wordstore": {
    ...wordstore,
    [selectedText.toLowerCase()]: [selectedText, +new Date],
  }});
};

const getStore = () => new Promise(resolve => browser.storage.local.get("wordstore", wordstore => {
  if (wordstore.wordstore) {
    resolve(wordstore.wordstore);
  }
  else {
    resolve({});
  }
}));