let contacts = [];
let selectedContactsIDs = [];
let subtaskInputs = [];
let selectedPrio = "";

async function getContacts(path = "contacts/") {
  let response = await fetch(`${BASE_URL}${path}.json`);
  let contactData = await response.json();

  contacts = Object.entries(contactData).map(([id, details]) => ({
    id,
    name: details.name,
    email: details.email,
    phone: details.phone,
    colorId: details.colorId,
  }));
}

function renderContacts(filteredContacts = contacts) {
  filteredContacts.sort((a, b) =>
    a.name.localeCompare(b.name, "de", { sensitivity: "base" })
  );

  let list = document.getElementById("contacts-checkbox");

  list.innerHTML = filteredContacts
    .map((contact) =>
      listContactsAddtask(contact.id, contact.name, contact.colorId)
    )
    .join("");

  list.style.display = "block";
}

function getInitials(name) {
  return name
    .split(" ")
    .map((word) => word[0].toUpperCase())
    .join("");
}

function filterContacts() {
  let searchTerm = document.getElementById("contact-search");
  searchTerm = searchTerm.value.toLowerCase();
  if (searchTerm === "") {
    renderContacts();
    return;
  }

  let filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().startsWith(searchTerm)
  );

  renderContacts(filteredContacts);
}

function toggleCheckbox(id) {
  if (selectedContactsIDs.includes(id)) {
    selectedContactsIDs = selectedContactsIDs.filter(
      (contactId) => contactId !== id
    );
  } else {
    selectedContactsIDs.push(id);
  }
  renderAssignedContacts(id);
  return;
}

function setCheckbox(id) {
  let checkbox = document.getElementById(`checkbox-${id}`);
  if (checkbox) {
    checkbox.checked = !checkbox.checked;
  }
  toggleCheckbox(id);
}

document.addEventListener("click", function (event) {
  let list = document.getElementById("contacts-checkbox");
  let searchBox = document.getElementById("contact-search");

  if (!list.contains(event.target) && event.target !== searchBox) {
    list.style.display = "none";
  }
});

function renderAssignedContacts() {
  let contactInfo = contacts.filter((contact) =>
    selectedContactsIDs.includes(contact.id)
  );

  let content = document.getElementById("assignedContacts");
  content.innerHTML = contactInfo
    .map((contact) => listAssingedContacts(contact.name, contact.colorId))
    .join("");
}

function setButtonColor(selectedButton) {
  resetButtonColors();
  let activeButton = document.getElementById(`button${selectedButton}`);
  selectedPrio = activeButton.id.replace("button", "").toLowerCase();

  if (!activeButton) return;

  let img = activeButton.querySelector("img");
  if (!img) return;

  const colors = {
    Urgent: "rgba(255, 61, 0, 1)",
    Medium: "rgba(255, 168, 0, 1)",
    Low: "rgba(122, 226, 41, 1)",
  };

  activeButton.style.backgroundColor = colors[selectedButton] || colors["Low"];
  activeButton.style.color = "rgba(255, 255, 255, 1)";

  img.style.filter =
    "brightness(0) saturate(100%) invert(93%) sepia(100%) saturate(0%) hue-rotate(141deg) brightness(104%) contrast(101%)";
}

function resetButtonColors() {
  let buttons = document.querySelectorAll("[id^='button']");

  buttons.forEach((button) => {
    button.style.backgroundColor = "rgba(255, 255, 255, 1)";
    button.style.color = "rgba(0, 0, 0, 1)";

    let img = button.querySelector("img");

    if (img) {
      img.style.filter = "none";
    }
  });
}

function selectInput() {
  showButtons();
  let input = document.getElementById("subtaskInput");
  input.focus();
  input.select();
}

function showButtons() {
  let checkCross = document.getElementById("checkCross");
  let addIcon = document.getElementById("addIcon");
  checkCross.style.display = "flex";
  addIcon.style.display = "none";
}

function hideButtons() {
  let checkCross = document.getElementById("checkCross");
  let addIcon = document.getElementById("addIcon");
  checkCross.style.display = "none";
  addIcon.style.display = "flex";
}

function clearInput() {
  let content = document.getElementById("subtaskInput");
  content.value = "";
  content.focus();
  content.select();
}

function confirmInput() {
  let input = document.getElementById("subtaskInput");

  if (input.value.trim() !== "") {
    subtaskInputs.push(input.value);
    renderSubtasks();
    clearInput();
  }
}

function renderSubtasks() {
  let list = document.getElementById("subtaskList");
  list.innerHTML = "";

  for (let i = 0; i < subtaskInputs.length; i++) {
    let content = subtaskInputs[i];
    list.innerHTML += listSubtasks(i, content);
  }
}

function editListItem(index) {
  let listItem = document.getElementById(`listItem-${index}`);
  let editIcon = document.getElementById(`editIcon-${index}`);
  let checkIcon = document.getElementById(`checkIcon-${index}`);

  listItem.setAttribute("contenteditable", "true");
  listItem.focus();

  editIcon.style.display = "none";
  checkIcon.style.display = "block";
}

function updateListItem(index) {
  let listItem = document.getElementById(`listItem-${index}`);
  let editIcon = document.getElementById(`editIcon-${index}`);
  let checkIcon = document.getElementById(`checkIcon-${index}`);

  subtaskInputs[index] = listItem.innerText.trim();

  listItem.setAttribute("contenteditable", "false");

  editIcon.style.display = "block";
  checkIcon.style.display = "none";

  renderSubtasks();
}

function handleEnter(event, index) {
  if (event.key === "Enter") {
    event.preventDefault();
    updateListItem(index);
  }
}

function deleteListItem(index) {
  subtaskInputs.splice(index, 1);
  renderSubtasks();
}

document
  .getElementById("subtaskInput")
  .addEventListener("blur", function (event) {
    setTimeout(() => {
      let checkIcon = document.getElementById("checkCross");

      if (document.activeElement !== checkIcon) {
        hideButtons();
      }
    }, 100);
  });

document
  .getElementById("subtaskInput")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      confirmInput();
    }
  });

function resetAllInputs() {
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDescription").value = "";
  document.getElementById("contact-search").value = "";
  document.getElementById("date").value = "";
  document.getElementById("inputCategory").selectedIndex = 0;
  document.getElementById("subtaskInput").value = "";
  subtaskInputs = [];
  selectedContactsIDs = [];
  renderAssignedContacts();
  renderSubtasks();
  hideButtons();
}

async function getTaskData() {
  if (validateData()) {
    let data = prepareTaskData();
    try {
      await updateData("tasks", data);
      resetAllInputs();
      window.location.href = `../html/board.html`;
    } catch (error) {
      console.error("Error saving task:", error);
    }
  } else {
    return;
  }
}

async function updateData(path = "", data = {}) {
  const response = await fetch(BASE_URL + path + ".json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

function prepareTaskData() {
  let title = document.getElementById("taskTitle").value;
  let description = document.getElementById("taskDescription").value;
  let contact = selectedContactsIDs;
  let date = document.getElementById("date").value;
  let prio = selectedPrio;
  let category = document.getElementById("inputCategory").value;
  let subtask = subtaskInputs;

  return {
    title,
    description,
    contact,
    date,
    prio,
    category,
    subtask,
  };
}

function validateData() {
  let requiredFields = document.querySelectorAll("[required]");
  let category = document.getElementById("inputCategory").value;

  for (let field of requiredFields) {
    if (!field.value.trim()) {
      alert(
        `Das Feld ${field.previousElementSibling.textContent.trim()} ist erforderlich.`
      );
      field.focus();
      return false;
    }
  }

  if (!Array.isArray(selectedContactsIDs) || selectedContactsIDs.length === 0) {
    document.getElementById("contact-search").focus();
    alert("Mindestens ein Kontakt muss zugewiesen werden.");
    return false;
  }

  if (!category) {
    alert("Das Feld Kategorie ist erforderlich.");
    document.getElementById("inputCategory").focus();
    return false;
  }

  return true;
}
