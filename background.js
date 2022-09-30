browser.menus.create({
  id: "add-single-word",
  title: browser.i18n.getMessage("menuItemAddSingleWord"),
  contexts: ["selection"]
});

browser.menus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "add-single-word":
      saveWord(info.selectionText);
  }
});

const saveWord = word => {
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
  browser.storage.local.get()
  .then(wordstore => {

    // Do not add the same word twice!
    if (wordstore[selectedText.toLowerCase()]) {
      return;
    }

    // Save our new highlighted word.
    browser.storage.local.set({
      [selectedText.toLowerCase()]: selectedText
    });
  }, console.error);
};