/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
/* eslint-disable func-names */
/* eslint-disable no-plusplus */
/* eslint-disable no-console */
/* eslint-disable quotes */

// 1- Extracting data:
const generalConfig = getGameXML();
const parser = new DOMParser();
const doc = parser.parseFromString(generalConfig, "text/xml");
const title = doc.querySelector("game").getAttribute("title");
const defaultLevel = doc.querySelector("levels").getAttribute("default");
const levels = Array.from(doc.querySelectorAll("level")).map((level) => ({
  title: level.getAttribute("title"),
  rows: parseInt(level.querySelector("rows").textContent),
  cols: parseInt(level.querySelector("cols").textContent),
  mines: parseInt(level.querySelector("mines").textContent),
  time: parseInt(level.querySelector("time").textContent),
}));
console.log("Title :", title);
console.log("Default Level: ", defaultLevel);
console.log("Levels: ", levels);

// 2- creating new game levels
const gridResponse = getNewGame(`
<request>
    <rows>${levels[0].rows}</rows>
    <cols>${levels[0].cols}</cols>
    <mines>${levels[0].mines}</mines>
</request>
`);
//  finding Game Matirx
const allRows = levels[0].rows;
const allCols = levels[0].cols;
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
// Difference between flags and mines;
let flagNumber = 0;
// let rightClicked = false;
let rClickNumber = 0;
let clickNumber = 0;
// 3- making xsl for xslt Processor
$(document).ready(function () {
  const appendedGrid = $(".window");
  // Load XSL file using AJAX
  $.ajax({
    url: "grid.xsl",
    type: "GET",
    dataType: "xml",
    success: function (xslDoc) {
      // Parse gridResponse as XML document
      var xmlDoc = new DOMParser().parseFromString(gridResponse, "text/xml");
      // Create XSLT processor and import XSL document
      var xsltProcessor = new XSLTProcessor();
      xsltProcessor.importStylesheet(xslDoc);
      // Transform XML document using XSLT processor
      var resultDocument = xsltProcessor.transformToFragment(xmlDoc, document);
      // Append result document to window div
      appendedGrid.append(resultDocument);
      // Click or right click on each span
      appendedGrid
        .find("span")
        .on("contextmenu click mousedown", function (event) {
          event.preventDefault();
          if (event.which === 3) {
            rClickNumber++;
            diffrenceBetweenFlagsAndMines();
            $(this).off("click mousedown contextmenu").addClass("flag");
          } else if (event.which === 1) {
            $(this).off("click mousedown").addClass("revealed");
            if ($(this).data("value") === "mine") {
              // Check if the clicked span contains a mine
              mineClicked();
            } else {
              checkAdjacents($(this).index());
              clickNumber++;
            }
            console.log("Click Number: ", clickNumber);
            console.log("Right Click Number: ", rClickNumber);
          }
        });
    },
    error: function () {
      console.log("An error occurred while requesting the XSL file.");
    },
  });
});

// Handlers
const smile = document.querySelector(".smile");
const counterBox = document.querySelector(".counter");
counterBox.innerHTML = levels[0].mines;
// 4- Game Logic based On Events:
// 4-1 clicking on one span
function diffrenceBetweenFlagsAndMines() {
  flagNumber++;
  counterBox.innerHTML = levels[0].mines - flagNumber;
}
function mineClicked() {
  smile.dataset.value = "ok";
  $(".grid").children().off("click mousedown contextmenu");
  alert("MINE");
}
// 4-2 Adjacent mines
function calculateAdjacentMines(index) {
  let adjacentMines = 0;
  // get neighboring indexes
  let neighbors = neighborIndexes(index);
  // loop through neighboring indexes
  for (let i = 0; i < neighbors.length; i++) {
    let neighborIndex = neighbors[i];
    // check if neighbor index is within grid bounds
    if (neighborIndex >= 0 && neighborIndex <= allRows * allCols - 1) {
      // check if neighbor index contains a mine
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
function checkAdjacents(index) {
  const minesNumber = getAdjacentMines(index);
  if (minesNumber > 0) {
    $(".grid").children().eq(index).attr("data-value", minesNumber);
    return;
  } else {
    const cells = neighborIndexes(index);
    cells.forEach(function (cell) {
      const $cell = $(".grid").children().eq(cell);
      if (!$cell.hasClass("revealed") && !$cell.hasClass("flag")) {
        $cell.addClass("revealed");
        checkAdjacents(cell);
      }
    });
  }
}
