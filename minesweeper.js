/* eslint-disable no-undef */
/* eslint-disable func-names */
/* eslint-disable no-plusplus */
/* eslint-disable no-console */
/* eslint-disable quotes */

// 1- Extracting data:
const doc = new DOMParser().parseFromString(getGameXML(), "text/xml");
console.log(doc);
const title = doc.querySelector("game").getAttribute("title");
const defaultLevel = doc.querySelector("levels").getAttribute("default") - 1;
const levels = Array.from(doc.querySelectorAll("level")).map((level) => ({
  title: level.getAttribute("title"),
  id: parseInt(level.getAttribute("id")),
  rows: parseInt(level.querySelector("rows").textContent),
  cols: parseInt(level.querySelector("cols").textContent),
  mines: parseInt(level.querySelector("mines").textContent),
  time: level.querySelector("time")
    ? parseInt(level.querySelector("time").textContent)
    : null,
}));
console.log("Title :", title);
console.log("Default Level: ", defaultLevel);
console.log("Levels: ", levels);
// Handlers
const counterBox = document.querySelector(".counter");
const timer = document.querySelector("#timer");
// Loading defaults
let isTimer = false;
let allRows;
let allCols;
let allMines = levels[defaultLevel].mines;
let topRightBox;
let time;
let flagNumber;
let clickNumber = 0;
let gridResponse;
let basis;
let gridXsl;
counterBox.innerHTML = allMines;
const bottomRight =
  '<div class="bottomRight" style="pointer-events: all;cursor:pointer;z-index:200;background-color:red;position:absolute;right:-5px;bottom:-5px;width:25px;height:25px"></div>';
let allRevealedSpans;
let allGcells;
// timer variables
var gameTimer;
var timeleft;
let timerSet = false;
function gameTimerFunction(timeleft) {
  clearInterval(gameTimer);
  timerSet = true;
  gameTimer = setInterval(function () {
    if (timeleft <= 0) {
      // clearInterval(gameTimer);
      smile.dataset.value = "ok";
      $(".grid").children().off("mousedown contextmenu");
      setTimeout(() => {
        alert("Time Out");
      }, 1000);
    } else {
      timer.innerHTML = timeleft;
    }
    timeleft -= 1;
  }, 1000);
}
// Getting row of Index
function updateGridResponse(selectedLevel, update = false) {
  document.getElementById("timer").innerHTML = "";
  if (selectedLevel) {
    gridResponse = getNewGame(`
    <request>
        <rows>${selectedLevel.rows}</rows>
        <cols>${selectedLevel.cols}</cols>
        <mines>${selectedLevel.mines}</mines>
    </request>
  `);
    if (selectedLevel.time) {
      isTimer = true;
      timerSet = true;
      timeleft = selectedLevel.time;
    } else {
      isTimer = false;
      timerSet = false;
      clickNumber = 0;
      clearInterval(gameTimer);
    }
    // if istimer=== true ==> timer.innerHtml=gameTimerFunction(timeleft)else

    allRows = selectedLevel.rows;
    allCols = selectedLevel.cols;
    allMines = selectedLevel.mines;
    flagNumber = 0;
  }
  basis = 100 / selectedLevel.cols + "%";
  allGcells = selectedLevel.cols * selectedLevel.rows;
  // Timer part

  var gridXml = new DOMParser().parseFromString(gridResponse, "text/xml");
  var xsltProcessor = new XSLTProcessor();
  xsltProcessor.importStylesheet(gridXsl);
  var gridContent = xsltProcessor.transformToFragment(gridXml, document);
  if (update === false) {
    $(".window").append(gridContent);
    $(".window").append(bottomRight);
  } else {
    $(".grid").replaceWith(gridContent);
    diffrenceBetweenFlagsAndMines();
  }

  $(".gCell").css("flex-basis", basis);
  $(".gCell").on("contextmenu", function (r) {
    r.preventDefault();
  });
  $(".gCell").on("mousedown", function (event) {
    event.preventDefault();
    if (event.which === 3) {
      const flaggedSpan = $(this);
      if (!flaggedSpan.hasClass("flag") && flaggedSpan.hasClass("revealed")) {
        checkStatus(true, flaggedSpan.index());
      }
      if (!flaggedSpan.hasClass("flag") && !flaggedSpan.hasClass("revealed")) {
        checkStatus(true, flaggedSpan.index());
      } else {
        flagNumber--;
        flaggedSpan.removeClass("flag");
        diffrenceBetweenFlagsAndMines();
      }
    }
    if (event.which === 1) {
      // whereas user can click on revealed cells to use recursive I put this code here it can be moved to *
      if (isTimer === false) {
        clickNumber++;
        timer.innerHTML = clickNumber;
      }
      if (timerSet === true) {
        gameTimerFunction(timeleft);
        timerSet = false;
      }
      const noneFlaggedSpan = $(this);
      if (
        !noneFlaggedSpan.hasClass("revealed") &&
        !noneFlaggedSpan.hasClass("flag")
      ) {
        // *;
        checkStatus(false, noneFlaggedSpan.index());
        if (noneFlaggedSpan.data("value") === "mine") {
          mineClicked(noneFlaggedSpan.index());
        } else {
          revealNeighbors(noneFlaggedSpan.index());
        }
      } else if (noneFlaggedSpan.hasClass("revealed")) {
        revealAndCheck(noneFlaggedSpan.index());
      }
    }
  });
  $(".smile").on("mouseenter", function (r) {
    $(this).hover(
      function () {
        $(this).attr("data-value", "hover");
      },
      function () {
        $(this).attr("data-value", "normal");
      }
    );
  });
  // Dragging start
  let windowNode = document.querySelector(".window");
  let gameTitleNode = document.querySelector(".title-bar");
  gameTitleNode.onmousedown = function (event) {
    if (event.target === smile || event.target === bottomRightNode) {
      return false;
    }
    if (event.which === 1) {
      let shiftX = event.clientX - windowNode.getBoundingClientRect().left;
      let shiftY = event.clientY - windowNode.getBoundingClientRect().top;

      windowNode.style.position = "absolute";
      windowNode.style.zIndex = 1000;
      document.body.append(windowNode);
      moveAt(event.pageX, event.pageY);
      function moveAt(pageX, pageY) {
        windowNode.style.left = pageX - shiftX + "px";
        windowNode.style.top = pageY - shiftY + "px";
      }
      function onMouseMove(event) {
        moveAt(event.pageX, event.pageY);
      }
      document.addEventListener("mousemove", onMouseMove);
      document.onmouseup = function () {
        document.removeEventListener("mousemove", onMouseMove);
        gameTitleNode.onmouseup = null;
      };
    }
  };
  // Resize Start
  const bottomRightNode = document.querySelector(".bottomRight");
  const gridNode = document.querySelector(".grid");
  let gridWidth = parseInt(
    getComputedStyle(gridNode).getPropertyValue("width")
  );
  let gridHeight = parseInt(
    getComputedStyle(gridNode).getPropertyValue("height")
  );
  console.log(gridHeight);
  bottomRightNode.onmousedown = function (event) {
    if (event.which === 1) {
      let startX = event.clientX;
      let startY = event.clientY;
      let windowStartWidth = parseInt(
        document.defaultView.getComputedStyle(windowNode).width,
        10
      );
      let windowStartHeight = parseInt(
        document.defaultView.getComputedStyle(windowNode).height,
        10
      );
      function onResizeMouseMove(event) {
        let newWidth = windowStartWidth + event.clientX - startX;
        let newHeight = windowStartHeight + event.clientY - startY;
        if (newWidth >= gridWidth) {
          windowNode.style.width = newWidth + "px";
        }
        if (newHeight >= gridHeight + 110) {
          windowNode.style.height = newHeight + "px";
        }
      }
      document.addEventListener("mousemove", onResizeMouseMove);
      $(".bottomRight").on("mouseleave", function () {
        document.removeEventListener("mousemove", onResizeMouseMove);
        bottomRightNode.onmouseup = null;
      });
    }
  };
}

// 3- making xsl for xslt Processor
// jaye window game title ro bezaram

$(document).ready(function () {
  $.ajax({
    url: "grid.xsl",
    type: "GET",
    dataType: "xml",
    success: function (gXsl) {
      // Initialize grid with default level
      var selectedLevel = levels[defaultLevel];
      gridXsl = gXsl;
      updateGridResponse(selectedLevel);
    },
    error: function () {
      console.log("An error occurred while requesting the XSL file.");
    },
  });
});
// 4- Game Logic based On Events:
// 4-1 clicking on one span
function getRowOfIndex(index) {
  return Math.trunc(index / allRows);
}
function getColOfIndex(index) {
  return Math.trunc(index % allCols);
}
function diffrenceBetweenFlagsAndMines() {
  counterBox.innerHTML = allMines - flagNumber;
}
// topRightCounter(isTimerSet());
function checkStatus(isRightClick, index) {
  allRevealedSpans = $(".revealed").length;
  console.log(allRevealedSpans);
  if (!isRightClick) {
    $(".grid").children().eq(index).addClass("revealed");
  } else {
    $(".grid").children().eq(index).addClass("flag");
    flagNumber++;
    diffrenceBetweenFlagsAndMines();
  }
  if (allRevealedSpans === allGcells - allMines && flagNumber === allMines) {
    setTimeout(() => {
      alert("You are Winner");
    }, 500);
    $(".smile").attr("data-value", "win");
    $(".grid").children().off("mousedown contextmenu");
    clearTimeout(gameTimer);
  }
}
let smile = document.querySelector(".smile");
// Add event listener to smile button
smile.onmousedown = function (e) {
  e.preventDefault();
  const levelNames = levels.map((level) => level.title);
  const selectedLevelName = prompt(
    `☺لطفا مرحله رو انتخاب کنید: ${levelNames.join(", ")}`
  );
  const selectedLevel = levels.find(
    (level) => level.title === selectedLevelName
  );
  if (selectedLevel) {
    updateGridResponse(selectedLevel, true);
  }
};
function mineClicked(index) {
  smile.dataset.value = "ok";
  $(".grid").children().eq(index).addClass("revealed");
  $(".grid").children().off("mousedown contextmenu");
  clearTimeout(gameTimer);
  setTimeout(() => {
    alert("Game Over");
  }, 500);
}

// 4-2 Adjacent mines
function calculateAdjacentMines(index) {
  let adjacentMines = 0;
  let neighbors = neighborIndexes(index);
  for (let i = 0; i < neighbors.length; i++) {
    let neighborIndex = neighbors[i];
    if (neighborIndex >= 0 && neighborIndex <= allRows * allCols - 1) {
      const $neighborSpan = $(".grid").children().eq(neighborIndex);
      if ($neighborSpan.data("value") === "mine") {
        adjacentMines++;
      }
    }
  }
  return adjacentMines;
}
function validator(cellIndex) {
  let i = cellIndex[0];
  let j = cellIndex[1];
  if (0 <= i && i <= allRows - 1 && 0 <= j && j <= allCols - 1) {
    return [i, j];
  }
  return false;
}
function getCellIndex(matrix) {
  let i = matrix[0];
  let j = matrix[1];
  return i * allRows + j;
}
function neighborIndexes(index) {
  let iIndex = getRowOfIndex(index);
  let jIndex = getColOfIndex(index);
  let resultArray = [];
  const cell = [iIndex, jIndex];
  const cells = [
    [iIndex - 1, jIndex - 1],
    [iIndex - 1, jIndex],
    [iIndex - 1, jIndex + 1],
    [iIndex, jIndex - 1],
    [iIndex, jIndex + 1],
    [iIndex + 1, jIndex - 1],
    [iIndex + 1, jIndex],
    [iIndex + 1, jIndex + 1],
  ];
  cells.forEach((el) => {
    if (validator(el)) {
      resultArray.push(getCellIndex(el));
    }
  });
  return resultArray;
}
function getAdjacentMines(index) {
  return calculateAdjacentMines(index);
}
function revealNeighbors(index) {
  const minesNumber = getAdjacentMines(index);
  if (minesNumber > 0) {
    $(".grid").children().eq(index).attr("data-value", minesNumber);
    // .addClass("revealed");
    checkStatus(false, index);
  } else {
    const cells = neighborIndexes(index);
    cells.forEach(function (cell) {
      const $cell = $(".grid").children().eq(cell);
      if (!$cell.hasClass("revealed") && !$cell.hasClass("flag")) {
        // $cell.addClass("revealed");
        checkStatus(false, cell);
        revealNeighbors(cell);
      }
    });
  }
}

function revealAndCheck(index) {
  let neighFlagNumber = 0;
  const parent = $(".grid").children();
  let selectedCell = parent.eq(index).data("value");
  let newArr = [];
  let neighbors = neighborIndexes(index);
  neighbors.forEach((neighbor) => {
    if (parent.eq(neighbor).hasClass("flag")) {
      neighFlagNumber++;
    } else if (!parent.eq(neighbor).hasClass("revealed")) {
      newArr.push(neighbor);
    }
  });
  if (selectedCell <= neighFlagNumber) {
    console.log("neighbor Flag Numbers :", neighFlagNumber);
    newArr.forEach((element) => {
      if (parent.eq(element).data("value") === "mine") {
        mineClicked(element);
      } else {
        checkStatus(false, element);
        revealNeighbors(element);
      }
    });
  } else {
    console.log("Global Flag Numbers :", flagNumber);
    console.log("not enough flags");
  }
}
// Modal
const btn = document.querySelector(".modal-btn");
const input = document.querySelector(".field");
const modal = document.querySelector(".modal-content");
function letters(inputText) {
  let letter = /^[A-Za-z\u0600-\u06FF\s]+$/;
  if (inputText.value.match(letter)) {
    modal.style.display = "none";
    return true;
  } else {
    setTimeout(() => {
      alert("برای نام کاربری از حروف استفاده کنید...");
    }, 500);
    return false;
  }
}

btn.addEventListener("click", function () {
  letters(input);
});
// const windowPoint = $(".window").position();
// console.log("Window Position: ", windowPoint);
// const getPsuedo = window
//   .getComputedStyle(document.querySelector(".window"), ":after")
//   .getPropertyPriority("position");
// .getPropertyValue("width");
// .getPropertyPriority("width");
// console.log(getPsuedo);
// $(function () {
//   $(".window").draggable();
//   $(".window").resizable();
// });
// brainStorm
// allGcell=>whenever revealed is run,allGcell--;if allGCell===0 winner
