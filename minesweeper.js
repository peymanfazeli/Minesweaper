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
  time: parseInt(level.querySelector("time").textContent),
}));
console.log("Title :", title);
console.log("Default Level: ", defaultLevel);
console.log("Levels: ", levels);
// Handlers
const counterBox = document.querySelector(".counter");
const timer = document.querySelector("#timer");
// Loading defaults
let allRows;
let allCols;
let allMines = levels[defaultLevel].mines;
let time;
let flagNumber;
let gridResponse;
let basis;
counterBox.innerHTML = allMines;
const bottomRight =
  '<div class="bottomRight" style="pointer-events: all;cursor:pointer;z-index:200;background-color:red;position:absolute;right:-5px;bottom:-5px;width:25px;height:25px"></div>';
let allRevealedSpans;
let allGcells;
// timer variables
var gameTimer;
var timeleft;
// Getting row of Index
function updateGridResponse(selectedLevel, gridXsl, update = false) {
  if (selectedLevel) {
    gridResponse = getNewGame(`
    <request>
        <rows>${selectedLevel.rows}</rows>
        <cols>${selectedLevel.cols}</cols>
        <mines>${selectedLevel.mines}</mines>
    </request>
  `);
    time = selectedLevel.time;
    allRows = selectedLevel.rows;
    allCols = selectedLevel.cols;
    allMines = selectedLevel.mines;
    flagNumber = 0;
  }
  basis = 100 / selectedLevel.cols + "%";
  allGcells = selectedLevel.cols * selectedLevel.rows;
  // timer.innerHTML = time;
  // Timer part
  timeleft = time;
  gameTimer = setInterval(function () {
    if (timeleft <= 0) {
      clearInterval(gameTimer);
      document.getElementById("timer").innerHTML = "Finished";
      smile.dataset.value = "ok";
      $(".grid").children().off("mousedown contextmenu");
      alert("Time Out");
    } else {
      document.getElementById("timer").innerHTML = timeleft;
    }
    timeleft -= 1;
  }, 1000);

  // Parse gridResponse as XML document
  var gridXml = new DOMParser().parseFromString(gridResponse, "text/xml");
  // Create XSLT processor and import XSL document
  var xsltProcessor = new XSLTProcessor();
  xsltProcessor.importStylesheet(gridXsl);
  // Transform XML document using XSLT processor
  var gridContent = xsltProcessor.transformToFragment(gridXml, document);
  // Replace existing grid with new content
  if (update === false) {
    $(".window").append(gridContent);
    $(".window").append(bottomRight);
  } else {
    $(".grid").replaceWith(gridContent);
    diffrenceBetweenFlagsAndMines();
    clearInterval(gameTimer);
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
      const noneFlaggedSpan = $(this);
      // checkStatus();
      if (
        !noneFlaggedSpan.hasClass("revealed") &&
        !noneFlaggedSpan.hasClass("flag")
      ) {
        // noneFlaggedSpan.addClass("revealed");
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
  windowNode.onmousedown = function (event) {
    if (event.target === smile || event.target === bottomRightNode) {
      return false;
    }
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
    windowNode.onmouseup = function () {
      document.removeEventListener("mousemove", onMouseMove);
      windowNode.onmouseup = null;
    };
  };
  // Resize Start
  const bottomRightNode = document.querySelector(".bottomRight");
  bottomRightNode.onmousedown = function (event) {
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
      windowNode.style.width = newWidth + "px";
      windowNode.style.height = newHeight + "px";
    }
    document.addEventListener("mousemove", onResizeMouseMove);
    $(".bottomRight").on("mouseup", function () {
      document.removeEventListener("mousemove", onResizeMouseMove);
      bottomRightNode.onmouseup = null;
    });
    // bottomRightNode.onmouseup = function () {
    //   console.log(bottomRightNode);
    //   bottomRightNode.onmouseup = null;
    // };
  };

  // Resize end
  // windowNode.ondragstart = function () {
  //   return false;
  // };
  // Dragging end
}

// 3- making xsl for xslt Processor
// jaye window game title ro bezaram

$(document).ready(function () {
  $.ajax({
    url: "grid.xsl",
    type: "GET",
    dataType: "xml",
    success: function (gridXsl) {
      // Initialize grid with default level
      var selectedLevel = levels[defaultLevel];
      updateGridResponse(selectedLevel, gridXsl);
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
          updateGridResponse(selectedLevel, gridXsl, true);
        }
      };
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
function checkStatus(isRightClick, index) {
  allRevealedSpans = $(".revealed").length;
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
function mineClicked(index) {
  smile.dataset.value = "ok";
  $(".grid").children().eq(index).addClass("revealed");
  $(".grid").children().off("mousedown contextmenu");
  clearTimeout(gameTimer);
  setTimeout(() => {
    alert("Game Over");
  }, 500);
}
// function timerGame(time) {
//   var timeleft = time;
//   var gameTimer = setInterval(function () {
//     if (timeleft <= 0) {
//       clearInterval(gameTimer);
//       document.getElementById("timer").innerHTML = "Finished";
//       smile.dataset.value = "ok";
//       ".grid".children().off("mousedown contextmenu");
//       alert("Time Out");
//     } else {
//       document.getElementById("timer").innerHTML = timeleft;
//     }
//     timeleft -= 1;
//   }, 1000);
// }
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
        revealNeighbors(element);
      }
    });
  } else {
    console.log("Global Flag Numbers :", flagNumber);
    console.log("not enough flags");
  }
}
// Dragging and resizing window box
// Resize

const windowPoint = $(".window").position();
console.log("Window Position: ", windowPoint);

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
// @Todo1:when click on a span that has numeric data-value when there is no other spans it must show the winner(check the recursive part for adding checkStatus())
// @Todo2: timer must be stopped when it is ended and must be cleared when the level is changed
