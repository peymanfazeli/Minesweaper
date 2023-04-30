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

      // Right click on each span
      // Click or right click on each span
      appendedGrid
        .find("span")
        .on("contextmenu click mousedown", function (event) {
          event.preventDefault();

          if (event.which === 3) {
            $(this).off("click mousedown").addClass("flag");
          } else if (event.which === 1) {
            $(this).off("click mousedown").addClass("revealed");
            // Check if the clicked span contains a mine
            if ($(this).data("value") === "mine") {
              console.log($(this).data("value"));
              mineClicked();
            } else {
              checkAdjacents($(this).index());
            }
          }
        });
      console.log("Successfully appended....");
    },
    error: function () {
      console.log("An error occurred while requesting the XSL file.");
    },
  });
});

// Handlers
const smile = document.querySelector(".smile");
// 4- Game Logic based On Events:
// 4-1 clicking on one span
function mineClicked() {
  smile.dataset.value = "ok";
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
function neighborIndexes(index) {
  // constants
  const left = index - 1;
  const right = index + 1;
  // top
  const topCenter = index - allRows;
  const topRight = topCenter + 1;
  const topLeft = topCenter - 1;
  // bottom
  const bottomCenter = index + allRows;
  const bottomLeft = bottomCenter - 1;
  const bottomRight = bottomCenter + 1;
  const indexesArray = [];
  let indexRow = getRowOfIndex(index);
  let indexCol = getColOfIndex(index);
  // special case for rightmost spans
  // const isRightmost = indexCol === allCols - 1;
  // validator
  if (indexRow === 0 && indexCol === 0) {
    // top left span
    indexesArray.push(right, bottomCenter, bottomRight);
  } else if (indexRow === 0 && indexCol === allCols - 1) {
    // top right span
    indexesArray.push(left, bottomLeft, bottomCenter);
  } else if (indexRow === allRows - 1 && indexCol === 0) {
    // bottom left span
    indexesArray.push(topCenter, topRight, right);
  } else if (indexRow !== 0 && indexRow !== allRows - 1 && indexCol === 0) {
    // left wing spans
    indexesArray.push(topCenter, topRight, right, bottomCenter, bottomRight);
    console.log(indexesArray);
  } else if (
    indexRow !== 0 &&
    indexRow !== allRows - 1 &&
    indexCol === allCols - 1
  ) {
    // right wing spans
    indexesArray.push(topCenter, topLeft, left, bottomLeft, bottomCenter);
  } else if (indexRow === 0 && indexCol !== 0 && indexCol !== allCols - 1) {
    // top Row
    indexesArray.push(left, right, bottomLeft, bottomCenter, bottomRight);
  } else if (
    indexRow === allRows - 1 &&
    indexCol !== 0 &&
    indexCol !== allCols - 1
  ) {
    // bottom Row
    indexesArray.push(left, right, topLeft, topCenter, topRight);
  } else if (indexRow === allRows - 1 && indexCol === allCols - 1) {
    // bottom right span
    indexesArray.push(topCenter, topLeft, left);
    console.log(indexesArray);
  } else {
    indexesArray.push(
      topLeft,
      topCenter,
      topRight,
      left,
      right,
      bottomLeft,
      bottomCenter,
      bottomRight
    );
  }
  return indexesArray;
}
function getAdjacentMines(index) {
  return calculateAdjacentMines(index);
}
function checkAdjacents(index) {
  console.log("Clicked Index: ", index);
  if (index < 0 || index > allRows * allCols - 1) {
    return;
  } else {
    const minesNumber = getAdjacentMines(index);
    console.log("mines Number: ", minesNumber);
    if (minesNumber > 0) {
      $(".grid").children().eq(index).attr("data-value", minesNumber);
      console.log("Index of Shown Span that must be a mine number: ", index);
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
}
