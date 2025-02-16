let tasks = [];
let contactsBoard = [];
let urgencySymbols = [
  "../assets/icons/add_task/prio-low-icon.svg",
  "../assets/icons/add_task/prio-medium-icon.svg",
  "../assets/icons/add_task/prio-urgent-icon.svg",
];
/**
 * Fetches tasks from the database and stores them in the tasks array.
 * @param {string} [path='tasks/'] - The API path to fetch tasks.
 */

async function getContactsBoard(path = `contacts/`) {
  contactsBoard = [];
  let response = await fetch(BASE_URL + path + ".json");
  let contactData = await response.json();
  Object.entries(contactData).forEach(([id, details]) => {
    contactsBoard.push({
      id: id,
      name: details.name,
      email: details.email,
      phone: details.phone,
      colorId: details.colorId,
    });
  });
}

async function getTasks(path = `tasks/`) {
  await getContactsBoard();
  tasks = [];
  let response = await fetch(BASE_URL + path + ".json");
  let tasksData = await response.json();
  Object.entries(tasksData).forEach(([id, content]) => {
    tasks.push({
      id: id,
      status: content.status,
      category: content.category,
      title: content.title,
      description: content.description,
      subtasks: content.subtask,
      assigned: content.contact,
      prio: content.prio,
      date: content.date,
    });
  });
  renderTasks();
}

function renderTasks() {
  let todo = document.getElementById("board_todo");
  let progress = document.getElementById("board_progress");
  let feedback = document.getElementById("board_feedback");
  let done = document.getElementById("board_done");
  clearTasksContent();

  for (let i = 0; i < tasks.length; i++) {
    let task = tasks[i];
    let taskElement = document.createElement("div");
    taskElement.innerHTML = listTasks(
      task,
      i,
      formatCategoryText(task.category)
    );
    taskElement = taskElement.firstElementChild;

    switch (task.status) {
      case "todo":
        todo.appendChild(taskElement);
        break;
      case "progress":
        progress.appendChild(taskElement);
        break;
      case "feedback":
        feedback.appendChild(taskElement);
        break;
      case "done":
        done.appendChild(taskElement);
        break;
      default:
        console.warn("Unbekannter Status:", task.status);
    }
    getAssignedContacts(task.assigned, i);
    renderProgressbarSubtask(task.subtasks, i);
  }
}

function getAssignedContacts(contactIDs, index) {
  let content = document.getElementById("cardContact-" + index);
  content.innerHTML = "";

  let assignedContacts = contactsBoard.filter((contact) =>
    contactIDs.includes(contact.id)
  );
  for (let i = 0; i < assignedContacts.length; i++) {
    content.innerHTML += listCardContacts(assignedContacts[i]);
  }

  let witdhContainer =
    assignedContacts.length === 1 ? 32 : (assignedContacts.length - 1) * 32;

  content.style.width = witdhContainer + "px";
}

function formatCategoryText(category) {
  let formatCategory = category.trim().split(" ");
  formatCategory.pop().toLowerCase();
  let formattedText = formatCategory.join(" ").toLowerCase();
  return formattedText;
}

function truncateText(text) {
  return text.length > 48 ? text.substring(0, 48) + "..." : text;
}

/**
 * Filters tasks based on search input and updates the board.
 * Shows a message if no tasks match the search criteria.
 */
function searchTasks() {
  let searchInput = document
    .querySelector("#board-search-container input")
    .value.toLowerCase();
  let taskContainers = document.querySelectorAll(".board-card");
  let noResultsMessage = document.getElementById("no-results-message");
  let foundTasks = false;

  taskContainers.forEach((task) => {
    let title = task
      .querySelector(".card-title-discription p.weight700")
      .innerText.toLowerCase();
    let description = task
      .querySelector(".card-title-discription p.weight400")
      .innerText.toLowerCase();

    if (title.includes(searchInput) || description.includes(searchInput)) {
      task.style.display = "flex";
      foundTasks = true;
    } else {
      task.style.display = "none";
    }
  });

  if (!foundTasks) {
    noResultsMessage.style.display = "block";
  } else {
    noResultsMessage.style.display = "none";
  }
}

async function drop(ev, targetColumn) {
  ev.preventDefault();
  let taskId = ev.dataTransfer.getData("text");
  let draggedElement = document.getElementById(taskId);
  let dropTarget = document.getElementById("board_" + targetColumn);

  if (dropTarget && draggedElement) {
    dropTarget.appendChild(draggedElement);

    let dropTargetId = dropTarget.id;
    let task = tasks.find((t) => t.id === taskId);
    if (task) {
      task.status = dropTargetId.replace("board_", "");

      try {
        await updateTaskStatusInFirebase(taskId, task.status);
      } catch (error) {
        console.error("Error updating task status in Firebase:", error);
      }
    }
  }
}

async function updateTaskStatusInFirebase(taskId, newStatus) {
  try {
    const getResponse = await fetch(`${BASE_URL}tasks/${taskId}.json`);
    const existingData = await getResponse.json();

    existingData.status = newStatus;

    const response = await fetch(`${BASE_URL}tasks/${taskId}.json`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(existingData),
    });

    if (!response.ok) {
      throw new Error(
        `Fehler beim Aktualisieren der Task: ${response.statusText}`
      );
    }
  } catch (error) {
    console.error(
      "Fehler beim Aktualisieren des Task-Status in Firebase:",
      error
    );
    throw error;
  }
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}

/**
 * Displays the "No tasks" message if a column is empty.
 * @param {string} id - The ID of the board column.
 */
function showNoTask(id) {
  let container = document.getElementById(`board_${id}`);
  let content = document.getElementById(`no-task-${id}`);
  if ((container.children.length = 1)) {
    content.style.display = "flex";
  }
}
/**
 * Opens the "Add Task" overlay and hides the left navbar.
 */
function openAddTaskOverlay() {
  document.getElementById("addTaskOverlay").classList.remove("hidden");
}
/**
 * Closes the "Add Task" overlay and makes the left navbar visible again.
 */
function closeAddTaskOverlay() {
  document.getElementById("addTaskOverlay").classList.add("hidden");
}

/**
 * Event listener for search input
 */
document.addEventListener("DOMContentLoaded", () => {
  let searchInput = document.querySelector("#board-search-container input");
  let boardWrapper = document.querySelector(".board-wrapper");

  if (searchInput) {
    searchInput.addEventListener("input", searchTasks);

    let noResultsMessage = document.createElement("div");
    noResultsMessage.id = "no-results-message";
    noResultsMessage.innerText = "No results found.";
    noResultsMessage.style.display = "none";
    noResultsMessage.style.textAlign = "center";
    noResultsMessage.style.marginTop = "20px";
    noResultsMessage.style.fontSize = "18px";
    noResultsMessage.style.color = "#8B0000";

    boardWrapper.appendChild(noResultsMessage);
  }
});

function getTaskData(taskId) {
  let targetId = taskId;
  let taskKey = Object.keys(tasks).find((key) => tasks[key].id == targetId);
  clearTaskDetails();
  document.getElementById("taskDetailsHeader").innerHTML = tasks[taskKey].title;
  document.getElementById("taskDetailDescription").innerHTML =
    tasks[taskKey].description;
  document.getElementById("dueDateDetails").innerHTML = tasks[taskKey].date
    .split("-")
    .reverse()
    .join("/");
  let setPrio = tasks[taskKey].prio;
  document.getElementById("priorityDetails").innerHTML =
    String(setPrio).charAt(0).toUpperCase() + String(setPrio).slice(1);
  document.getElementById("taskTagDetails").innerHTML = tasks[taskKey].category;
  getAssigneeData(taskKey);
  getSubtaskData(taskKey, taskId);
  getPrioImage(setPrio);
}

function getPrioImage(setPrio) {
  let prioUrl = document.getElementById("priorityIcon");
  switch (setPrio) {
    case "low":
      prioUrl.src = urgencySymbols[0];
      break;
    case "medium":
      prioUrl.src = urgencySymbols[1];
      break;
    case "urgent":
      prioUrl.src = urgencySymbols[2];
  }
}

function getAssigneeData(taskKey) {
  for (
    let indexAssignee = 0;
    indexAssignee < tasks[taskKey].assigned.length;
    indexAssignee++
  ) {
    let assigneeId = tasks[taskKey].assigned[indexAssignee];
    let assigneeKey = Object.keys(contactsBoard).find(
      (key) => contactsBoard[key].id == assigneeId
    );
    if (contactsBoard[assigneeKey] == undefined) {
      continue;
    } else {
      let assignee = contactsBoard[assigneeKey].name;
      document.getElementById("assigneeDetails").innerHTML +=
        detailsAssigneesInsert(assignee);
    }
  }
}

function getSubtaskData(taskKey, taskId) {
  if (tasks[taskKey].subtasks == undefined) {
    return;
  } else {
    for (
      let indexSubtask = 0;
      indexSubtask < tasks[taskKey].subtasks.length;
      indexSubtask++
    ) {
      let subtaskList = tasks[taskKey].subtasks[indexSubtask].text;
      document.getElementById("substaskListDetails").innerHTML +=
        detailsSubtaskInsert(subtaskList, indexSubtask, taskId);
    }
  }
  getSubtaskStatus(taskKey);
}

function getSubtaskStatus(taskKey) {
  for (
    let indexSubStatus = 0;
    indexSubStatus < tasks[taskKey].subtasks.length;
    indexSubStatus++
  ) {
    let subtaskStatus = tasks[taskKey].subtasks[indexSubStatus].checked;

    let statusCheck = document.getElementById(`subtaskCheck${indexSubStatus}`);
    switch (subtaskStatus) {
      case 0:
        statusCheck.checked = false;
        break;
      case 1:
        statusCheck.checked = true;
    }
  }
}

function renderProgressbarSubtask(cardSubtasks, index) {
  let statusContainer = document.getElementById("subtaskStatus-" + index);
  let progress = document.getElementById("subtaskProgress-" + index);
  let tasksDone = document.getElementById("subtaskDone-" + index);

  if (cardSubtasks === undefined) {
    statusContainer.style.display = "none";
    return;
  }
  let progressData = calcProgressSubtask(cardSubtasks);
  let percentage =
    (progressData.checkedQuantity / progressData.totalQuantity) * 100;

  progress.style.width = percentage + "%";
  tasksDone.innerHTML =
    progressData.checkedQuantity +
    "/" +
    progressData.totalQuantity +
    " Subtasks";
}

function calcProgressSubtask(cardSubtasks) {
  let totalQuantity = cardSubtasks.length;
  let checkedQuantity = cardSubtasks.filter(
    (task) => task.checked === 1
  ).length;

  return {
    totalQuantity,
    checkedQuantity,
  };
}

function clearTaskDetails() {
  document.getElementById("taskDetailsHeader").innerHTML = "";
  document.getElementById("taskDetailDescription").innerHTML = "";
  document.getElementById("dueDateDetails").innerHTML = "";
  document.getElementById("priorityDetails").innerHTML = "";
  document.getElementById("taskTagDetails").innerHTML = "";
  document.getElementById("assigneeDetails").innerHTML = "";
  document.getElementById("substaskListDetails").innerHTML = "";
  document.getElementById("priorityIcon").src = "";
}

function clearTasksContent() {
  document.getElementById("board_todo").innerHTML = "";
  document.getElementById("board_progress").innerHTML = "";
  document.getElementById("board_feedback").innerHTML = "";
  document.getElementById("board_done").innerHTML = "";
}

async function subtaskStatusChange(indexSubtask, taskKey, subtaskId) {
  let checkStatus = document.getElementById(subtaskId);
  console.log(checkStatus.checked);
  if (checkStatus.checked == true) {
    let statusTrue = 1;
    await edit_data(
      (path = `tasks/${taskKey}/subtask/${indexSubtask}`),
      (data = {
        checked: statusTrue,
      })
    );
  } else {
    let statusFalse = 0;

    await edit_data(
      (path = `tasks/${taskKey}/subtask/${indexSubtask}`),
      (data = {
        checked: statusFalse,
      })
    );
  }
  getTasks();
}
