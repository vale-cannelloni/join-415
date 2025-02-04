let bgcolors = [
  { id: 0, rgba: "rgba(255, 105, 135, 1)" },
  { id: 1, rgba: "rgba(255, 180, 120, 1)" },
  { id: 2, rgba: "rgba(186, 85, 211, 1)" },
  { id: 3, rgba: "rgba(100, 200, 250, 1)" },
  { id: 4, rgba: "rgba(60, 179, 113, 1)" },
  { id: 5, rgba: "rgb(153, 197, 43)" },
  { id: 6, rgba: "rgba(218, 165, 32, 1)" },
  { id: 7, rgba: "rgb(205, 127, 224)" },
  { id: 8, rgba: "rgba(138, 43, 226, 1)" },
  { id: 9, rgba: "rgba(255, 165, 0, 1)" },
];

let contacts = [];

const BASE_URL =
  "https://join-415-default-rtdb.europe-west1.firebasedatabase.app/";

function init() {
  getContacts();
}

async function getContacts(path = `contacts/`) {
  contacts = [];
  let response = await fetch(BASE_URL + path + ".json");
  let contactData = await response.json();
  if (contactData == null) {
    document.getElementById("contactsList").innerHTML = "";
    document.getElementById("contactsDetailsDisplay").innerHTML = "";
    return;
  } else {
    Object.entries(contactData).forEach(([id, details]) => {
      contacts.push({
        id: id,
        name: details.name,
        email: details.email,
        phone: details.phone,
      });
    });
    sortContacts();
  }
}

function sortContacts() {
  contacts.sort((a, b) =>
    a.name.localeCompare(b.name, "de", { sensitivity: "base" })
  );
  groupContacts();
}

function groupContacts() {
  let grouped = {};

  for (let i = 0; i < contacts.length; i++) {
    let contact = contacts[i];
    let firstLetter = contact.name.charAt(0).toUpperCase();
    if (!grouped[firstLetter]) {
      grouped[firstLetter] = [];
    }
    grouped[firstLetter].push(contact);
  }

  let sortedGroups = Object.keys(grouped).sort();

  renderContacts(sortedGroups, grouped);
}

function renderContacts(sortedGroups, grouped) {
  document.getElementById("contactsList").innerHTML = "";

  let globalIndex = 0;

  for (let i = 0; i < sortedGroups.length; i++) {
    let letter = sortedGroups[i];

    document.getElementById("contactsList").innerHTML +=
      listContactHeader(letter);

    for (let j = 0; j < grouped[letter].length; j++) {
      let contact = grouped[letter][j];
      let contactName = contact.name;
      let contactEmail = contact.email;
      document.getElementById("contactsList").innerHTML += listContactData(
        contactName,
        contactEmail,
        globalIndex,
        getInitials(contactName)
      );
      getColorById(globalIndex);
      globalIndex++;
    }
  }
}

function getInitials(name) {
  return name
    .split(" ")
    .map((word) => word[0].toUpperCase())
    .join("");
}

function openContactDetails(indexContacts) {
  document.getElementById("contactsDetailsDisplay").innerHTML = "";
  let contactName = contacts[indexContacts].name;
  let contactEmail = contacts[indexContacts].email;
  let contactPhone = contacts[indexContacts].phone;
  document.getElementById("contactsDetailsDisplay").innerHTML =
    contactsFullDetails(
      contactName,
      contactEmail,
      contactPhone,
      indexContacts,
      getInitials(contactName)
    );
  getColorById(indexContacts);
}

async function getContactData() {
  if (checkName("nameInput") === true) {
    return;
  } else if (checkEmail("mailInput") === true) {
    return;
  } else if (checkPhone("telInput") === true) {
    return;
  } else {
    let name = document.getElementById("nameInput").value.trim();
    let email = document.getElementById("mailInput").value.trim();
    let phone = document.getElementById("telInput").value.trim();

    await update_data(
      (path = `contacts/`),
      (data = { name: name, email: email, phone: phone })
    );
    getContacts();
    clearInput("nameInput", "mailInput", "telInput");
    d_none("overlay");
  }
}

function checkName(insertedName) {
  let nameInput = document.getElementById(insertedName);
  let name = document.getElementById(insertedName).value.trim();
  let namePattern = new RegExp(nameInput.pattern);
  if (!name) {
    nameInput.setCustomValidity("Please insert a name");
    nameInput.reportValidity();
    return true;
  } else if (!namePattern.test(name)) {
    nameInput.setCustomValidity("Please insert first and last name");
    nameInput.reportValidity();
    return true;
  }
}

function checkEmail(insertedEmail) {
  let mailInput = document.getElementById(insertedEmail);
  let email = document.getElementById(insertedEmail).value.trim();
  let emailPattern = new RegExp(mailInput.pattern);
  if (!email) {
    mailInput.setCustomValidity("Please insert an email");
    mailInput.reportValidity();
    return true;
  } else if (!emailPattern.test(email)) {
    mailInput.setCustomValidity(
      "Please insert a valid email format, e.g.: name@email.com"
    );
    mailInput.reportValidity();
    return true;
  }
}

function checkPhone(insertedPhone) {
  let telInput = document.getElementById(insertedPhone);
  let phone = document.getElementById(insertedPhone).value.trim();
  let telPattern = new RegExp(telInput.pattern);
  if (!phone) {
    telInput.setCustomValidity("Please insert a number");
    telInput.reportValidity();
    return true;
  } else if (!telPattern.test(phone)) {
    telInput.setCustomValidity(
      "Please insert a valid phone number, e.g.: +49123456789"
    );
    telInput.reportValidity();
    return true;
  }
}

async function update_data(path = "", data = {}) {
  let response = await fetch(BASE_URL + path + ".json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await response.json();
}

async function delete_data(path) {
  let response = await fetch(BASE_URL + path + ".json", {
    method: "DELETE",
  });
  return await response.json();
}

async function deleteContact(path) {
  await delete_data(path);
  document.getElementById("contactsDetailsDisplay").innerHTML = "";
  getContacts();
}

async function edit_data(path = "", data = {}) {
  let response = await fetch(BASE_URL + path + ".json", {
    method: "PUT",
    header: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await response.json();
}

async function editUser(name, email, tel, id, indexContacts) {
  if (checkName("nameInputEdit") === true) {
    return;
  } else if (checkEmail("mailInputEdit") === true) {
    return;
  } else if (checkPhone("telInputEdit") === true) {
    return;
  } else {
    let changeName = document.getElementById(name).value;
    let changeEmail = document.getElementById(email).value;
    let changeTel = document.getElementById(tel).value;
    await edit_data(
      (path = `contacts/` + id),
      (data = { name: changeName, email: changeEmail, phone: changeTel })
    );
    await getContacts();
    clearInput(name, email, tel);
    d_none("overlayEdit");
    openContactDetails(indexContacts);
  }
}

function clearInput(name, email, tel) {
  document.getElementById(name).value = "";
  document.getElementById(email).value = "";
  document.getElementById(tel).value = "";
}

function getColorById(id) {
  let reducedId = id % 10;
  let color = bgcolors[reducedId];

  let element = document.getElementById(`bg-${id}`);
  let bgelement = document.getElementById(`details-bg-${id}`);
  let editbgelement = document.getElementById(`edit-bg-${id}`);

  if (bgelement === null && editbgelement === null) {
    element.style.backgroundColor = color.rgba;
  } else {
    if (bgelement !== null) {
      bgelement.style.backgroundColor = color.rgba;
    }
    if (editbgelement !== null) {
      editbgelement.style.backgroundColor = color.rgba;
    }
  }
}

function openCreateOverlay() {
  document.getElementById("overlay").innerHTML = overlayCreateUser();
}

function openEditOverlay(indexContacts) {
  document.getElementById("overlayEdit").innerHTML = "";
  let contactId = contacts[indexContacts].id;
  let contactName = contacts[indexContacts].name;
  let contactEmail = contacts[indexContacts].email;
  let contactPhone = contacts[indexContacts].phone;
  document.getElementById("overlayEdit").innerHTML = overlayEditUser(
    contactName,
    contactEmail,
    contactPhone,
    indexContacts,
    getInitials(contactName),
    contactId
  );
  getColorById(indexContacts);
}
