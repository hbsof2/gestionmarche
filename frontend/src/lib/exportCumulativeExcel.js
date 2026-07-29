import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getUser } from "./auth";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

// Safe style copy helper
const safeCopyStyle = (sourceCell, targetCell) => {
  try {
    if (sourceCell && sourceCell.style) {
      targetCell.style = JSON.parse(JSON.stringify(sourceCell.style));
    }
  } catch (e) {
    // ignore, target keeps its default style
  }
};

async function exportCumulativeExcel(data, language = "AR") {
  try {
    const { items, info, period } = data;

    const currentUser = getUser();
    const userName = currentUser?.full_name || "";

    const templateName = language === "FR" ? "livraisonFR" : "livraisonAR";
    const templateUrl = `/templates/${templateName}.xlsx`;

    const response = await fetch(templateUrl);
    if (!response.ok) throw new Error("تعذر تحميل قالب التصدير");
    const arrayBuffer = await response.arrayBuffer();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.getWorksheet(1);

    const replaceCell = (cellAddress, value) => {
      worksheet.getCell(cellAddress).value = value;
    };

    const today = new Date();
    const exportDate = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

    if (language === "AR") {
      replaceCell("A1", userName);
      replaceCell("E1", null);
      replaceCell("A4", info.contractor_phone || "");
      replaceCell("E3", `يسلّم إلى : ${info.branch_name || ""}`);
      replaceCell("G8", exportDate);
    } else {
      replaceCell("I1", userName);
      replaceCell("E1", null);
      replaceCell("A4", info.contractor_phone || "");
      replaceCell("E3", `Livré à : ${info.branch_name || ""}`);
      replaceCell("G8", exportDate);
    }

    const startRow = 12;

    items.forEach((item, index) => {
      const rowNumber = startRow + index;
      const row = worksheet.getRow(rowNumber);

      if (index > 0) {
        row.height = worksheet.getRow(startRow).height;

        ["A", "B", "C", "G", "I"].forEach((col) => {
          const templateCell = worksheet.getCell(`${col}${startRow}`);
          const newCell = worksheet.getCell(`${col}${rowNumber}`);
          safeCopyStyle(templateCell, newCell);
        });
      }

      worksheet.getCell(`A${rowNumber}`).value = index + 1;
      worksheet.getCell(`B${rowNumber}`).value = parseFloat(item.total_quantity).toFixed(2);
      worksheet.getCell(`C${rowNumber}`).value =
        language === "AR" ? item.name_ar || "" : item.name_lat || item.name_ar || "";
      worksheet.getCell(`G${rowNumber}`).value = parseFloat(item.unit_price).toFixed(2);
      worksheet.getCell(`I${rowNumber}`).value = parseFloat(item.total_ht).toFixed(2);

      row.commit();
    });

    const lastMaterialRow = startRow + items.length - 1;
    const totalHtRow = lastMaterialRow + 1;
    const totalTtcRow = lastMaterialRow + 2;

    const totalHt = items.reduce((sum, item) => sum + parseFloat(item.total_ht), 0);
    const totalTtc = items.reduce((sum, item) => sum + parseFloat(item.total_ttc), 0);

    const originalTotalHtRow = 17;
    const originalTotalTtcRow = 18;

    ["I"].forEach((col) => {
      const templateHtCell = worksheet.getCell(`${col}${originalTotalHtRow}`);
      const templateTtcCell = worksheet.getCell(`${col}${originalTotalTtcRow}`);

      const newHtCell = worksheet.getCell(`${col}${totalHtRow}`);
      const newTtcCell = worksheet.getCell(`${col}${totalTtcRow}`);

      safeCopyStyle(templateHtCell, newHtCell);
      safeCopyStyle(templateTtcCell, newTtcCell);
    });

    if (totalHtRow !== originalTotalHtRow) {
      worksheet.getRow(originalTotalHtRow).eachCell((cell, colNumber) => {
        const newCell = worksheet.getCell(totalHtRow, colNumber);
        if (cell.value !== "totalht") {
          newCell.value = cell.value;
        }
        safeCopyStyle(cell, newCell);
      });

      worksheet.getRow(originalTotalTtcRow).eachCell((cell, colNumber) => {
        const newCell = worksheet.getCell(totalTtcRow, colNumber);
        if (cell.value !== "totalttc") {
          newCell.value = cell.value;
        }
        safeCopyStyle(cell, newCell);
      });

      worksheet.getRow(originalTotalHtRow).eachCell((cell) => {
        cell.value = null;
      });
      worksheet.getRow(originalTotalTtcRow).eachCell((cell) => {
        cell.value = null;
      });
    }

    worksheet.getCell(`I${totalHtRow}`).value = parseFloat(totalHt).toFixed(2);
    worksheet.getCell(`I${totalTtcRow}`).value = parseFloat(totalTtc).toFixed(2);

    // Clear all rows below totalttc row
    const lastRowWithData = totalTtcRow;
    const totalRows = worksheet.rowCount;

    for (let rowNum = lastRowWithData + 1; rowNum <= totalRows; rowNum++) {
      const row = worksheet.getRow(rowNum);

      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.value = null;
        cell.style = {};
        try {
          cell.merge = null;
        } catch (e) {
          // ignore
        }
      });

      row.height = undefined;
      row.commit();
    }

    // Also unmerge any merged cells below totalttc row
    worksheet.unMergeCells &&
      (() => {
        try {
          const merges = worksheet.model?.merges || [];
          merges.forEach((merge) => {
            const mergeStartRow = parseInt(merge.split(":")[0].replace(/[A-Z]/g, ""));
            if (mergeStartRow > lastRowWithData) {
              try {
                worksheet.unMergeCells(merge);
              } catch (e) {
                // ignore
              }
            }
          });
        } catch (e) {
          // ignore
        }
      })();

    const thankYouMessage =
      language === "AR" ? "شكــــــــــرا على ثقــــــــــتكم" : "Merci de votre confiance.";

    try {
      worksheet.unMergeCells(`A${totalHtRow}:F${totalTtcRow}`);
    } catch (e) {
      // ignore
    }

    worksheet.mergeCells(`A${totalHtRow}:F${totalTtcRow}`);

    const thankYouCell = worksheet.getCell(`A${totalHtRow}`);
    thankYouCell.value = thankYouMessage;
    thankYouCell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: false,
    };
    thankYouCell.font = {
      bold: true,
      size: 12,
    };

    const startStr = period.start_date.split("T")[0];
    const endStr = period.end_date.split("T")[0];
    const filename =
      language === "AR"
        ? `تراكمي_${info.branch_name}_${startStr}_${endStr}.xlsx`
        : `Cumulatif_${info.branch_name}_${startStr}_${endStr}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, filename);
  } catch (error) {
    console.error("Cumulative Excel export detailed error:", error);
    console.error("Error stack:", error.stack);
    throw error;
  }
}

export default exportCumulativeExcel;
