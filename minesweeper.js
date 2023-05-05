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
// working on levels array
let allRows = levels[defaultLevel].rows;
let allCols = levels[defaultLevel].cols;
let allMines = levels[defaultLevel].mines;
let time;
let gridResponse;
//  finding Game Matirx

let indexValue = 0;
function createCellArray(rows, cols) {
  const cellsMatrix = [];
  for (let i = 0; i < rows; i++) {
    cellsMatrix[i] = [];
    for (let j = 0; j < cols; j++) {
      cellsMatrix[i][j] = indexValue++;
    }
  }
  return cellsMatrix;
}
const matrix = createCellArray(allRows, allCols);
// Getting row of Index
function getRowOfIndex(index) {
  return Math.trunc(index / allRows);
}
function getColOfIndex(index) {
  return Math.trunc(index % allCols);
}
function updateGridResponse(selectedLevel = 0, gridXsl, update = false) {
  if (selectedLevel) {
    gridResponse = getNewGame(`
    <request>
        <rows>${selectedLevel.rows}</rows>
        <cols>${selectedLevel.cols}</cols>
        <mines>${selectedLevel.mines}</mines>
    </request>
  `);
    time = selectedLevel.time;
  }
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
  } else {
    $(".grid").replaceWith(gridContent);
  }
  $(".gCell").on("contextmenu", function (r) {
    r.preventDefault();
  });
  $(".gCell").on("mousedown", function (event) {
    event.preventDefault();
    if (event.which === 3) {
      const flaggedSpan = $(this);
      if (!flaggedSpan.hasClass("flag") && !flaggedSpan.hasClass("revealed")) {
        flagNumber++;
        diffrenceBetweenFlagsAndMines();
        flaggedSpan.addClass("flag");
      } else {
        flagNumber--;
        diffrenceBetweenFlagsAndMines();
        flaggedSpan.removeClass("flag");
      }
    }
    if (event.which === 1) {
      const noneFlaggedSpan = $(this);
      if (
        !noneFlaggedSpan.hasClass("revealed") &&
        !noneFlaggedSpan.hasClass("flag")
      ) {
        noneFlaggedSpan.addClass("revealed");
        if (noneFlaggedSpan.data("value") === "mine") {
          mineClicked(noneFlaggedSpan.index());
        } else {
          revealNeighbors(noneFlaggedSpan.index());
          console.log(noneFlaggedSpan.index());
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
}
// 3- making xsl for xslt Processor
$(document).ready(function () {
  // Load XSL file using AJAX
  $.ajax({
    url: "grid.xsl",
    type: "GET",
    dataType: "xml",
    success: function (gridXsl) {
      // Initialize grid with default level
      var selectedLevel = levels[0];
      updateGridResponse(selectedLevel, gridXsl);

      // Add event listener to smile button
      $(".smile").on("click", function (e) {
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
      });
    },
    error: function () {
      console.log("An error occurred while requesting the XSL file.");
    },
  });
});
// });
// Constants and Handlers
let flagNumber = 0;

// console.log(levelNumber);
const counterBox = document.querySelector(".counter");
counterBox.innerHTML = allMines;
// 4- Game Logic based On Events:
// 4-1 clicking on one span
function diffrenceBetweenFlagsAndMines() {
  counterBox.innerHTML = allMines - flagNumber;
}
let smile = document.querySelector(".smile");
function mineClicked(index) {
  smile.dataset.value = "ok";
  $(".grid").children().eq(index).addClass("revealed");
  $(".grid").children().off("mousedown contextmenu");
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
    $(".grid")
      .children()
      .eq(index)
      .attr("data-value", minesNumber)
      .addClass("revealed");
    return;
  } else {
    const cells = neighborIndexes(index);
    cells.forEach(function (cell) {
      const $cell = $(".grid").children().eq(cell);
      if (!$cell.hasClass("revealed") && !$cell.hasClass("flag")) {
        $cell.addClass("revealed");
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
