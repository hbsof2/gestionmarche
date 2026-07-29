import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

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

const round2 = (value) => Math.round((parseFloat(value) || 0) * 100) / 100;

async function exportInvoiceExcel(invoice, language = "AR") {
  try {
    const templateName = language === "FR" ? "factureFR" : "factureAR";
    const templateUrl = `/templates/${templateName}.xlsx`;

    const response = await fetch(templateUrl);
    if (!response.ok) throw new Error("تعذر تحميل قالب التصدير");
    const arrayBuffer = await response.arrayBuffer();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.getWorksheet(1);

    const { contractor = {}, authority = {}, items = [] } = invoice;

    // Fill header cells
    if (language === "AR") {
      worksheet.getCell("A1").value = contractor.full_name || "";
      worksheet.getCell("A3").value = contractor.designation || "";
      worksheet.getCell("A4").value = `العنوان : ${contractor.address || ""}`;
      worksheet.getCell("A5").value = `RC n° ${contractor.rc_number || ""}`;
      worksheet.getCell("A6").value =
        `${contractor.bank_name || ""} ${contractor.bank_address || ""} RIP N° ${contractor.bank_rip || ""}`;
      worksheet.getCell("A7").value = `AI : ${contractor.ai_number || ""}    NIF : ${contractor.nif || ""}`;
      worksheet.getCell("A8").value = `NIS : ${contractor.nis || ""}`;
      worksheet.getCell("B10").value = `Facture n° ${invoice.reference || ""}`;
      worksheet.getCell("B11").value = formatDate(invoice.invoice_date);
      worksheet.getCell("A12").value = `Tel : ${contractor.phone_mobile || ""}`;
      worksheet.getCell("A13").value = `Fax : ${contractor.fax || ""}`;
      worksheet.getCell("F10").value = `في ذمة : ${authority.name || ""}`;
    }

    // ═══════════════════════════════
    // STEP 1: Find and save placeholder rows from template
    // ═══════════════════════════════

    let originalTotalsStartRow = null;
    const placeholderRows = {};

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        const val = cell.value;
        if (val === "totalht" && !originalTotalsStartRow) {
          originalTotalsStartRow = rowNumber;
        }
        if (["totalht", "exo", "htva9", "tva9", "htva19", "tva19", "totalttc"].includes(val)) {
          placeholderRows[val] = rowNumber;
        }
      });
    });

    // Save styles and content from original total rows
    const savedTotalRows = {};
    if (originalTotalsStartRow) {
      for (let i = 0; i <= 4; i++) {
        const rowNum = originalTotalsStartRow + i;
        savedTotalRows[rowNum] = [];
        worksheet.getRow(rowNum).eachCell({ includeEmpty: true }, (cell, colNum) => {
          savedTotalRows[rowNum].push({
            col: colNum,
            value: cell.value,
            style: cell.style ? JSON.parse(JSON.stringify(cell.style)) : {},
          });
        });
      }
    }

    // ═══════════════════════════════
    // Save merge info from template row 18
    // ═══════════════════════════════

    const startRow = 18;
    const rowMerges = [];

    // Find all merges that exist in row 18 of the template
    if (worksheet.model && worksheet.model.merges) {
      worksheet.model.merges.forEach((merge) => {
        // Parse merge like "B18:E18"
        const match = merge.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
        if (match) {
          const startCol = match[1];
          const startRowNum = parseInt(match[2]);
          const endCol = match[3];

          if (startRowNum === startRow) {
            rowMerges.push({ startCol, endCol });
          }
        }
      });
    }

    // If no merges found from model, define them manually based on template:
    if (rowMerges.length === 0) {
      rowMerges.push(
        { startCol: "B", endCol: "E" }, // Name: B to E
        { startCol: "I", endCol: "J" }, // Unit price: I to J
        { startCol: "K", endCol: "L" } // Total: K to L
      );
    }

    // ═══════════════════════════════
    // STEP 2: Clear ALL rows from startRow to end of template
    // This prevents any template content from interfering with materials
    // ═══════════════════════════════

    const totalTemplateRows = worksheet.rowCount;

    for (let rowNum = startRow; rowNum <= totalTemplateRows; rowNum++) {
      worksheet.getRow(rowNum).eachCell({ includeEmpty: true }, (cell) => {
        cell.value = null;
      });
    }

    // ═══════════════════════════════
    // STEP 3: Write materials CONSECUTIVELY from row 18
    // ═══════════════════════════════

    items.forEach((item, index) => {
      const rowNumber = startRow + index; // 18, 19, 20, 21...

      // Apply merges FIRST (before writing values)
      rowMerges.forEach(({ startCol, endCol }) => {
        try {
          // Unmerge first to avoid conflicts
          worksheet.unMergeCells(`${startCol}${rowNumber}:${endCol}${rowNumber}`);
        } catch (e) {
          // ignore
        }
        try {
          worksheet.mergeCells(`${startCol}${rowNumber}:${endCol}${rowNumber}`);
        } catch (e) {
          // ignore
        }
      });

      // Write values AFTER merging
      worksheet.getCell(`A${rowNumber}`).value = index + 1;
      worksheet.getCell(`B${rowNumber}`).value =
        language === "AR" ? (item.name_ar || "") : (item.name_lat || item.name_ar || "");
      worksheet.getCell(`F${rowNumber}`).value = item.unit || "";

      const tvaCell = worksheet.getCell(`G${rowNumber}`);
      tvaCell.value = parseFloat(item.tva) / 100;
      tvaCell.numFmt = "0%";

      worksheet.getCell(`H${rowNumber}`).value = round2(item.total_quantity);

      // Unit price - write to I after merge is applied
      worksheet.getCell(`I${rowNumber}`).value = round2(item.unit_price);

      // Total - write to K after merge is applied
      worksheet.getCell(`K${rowNumber}`).value = round2(item.total_ht);

      // Apply alignment after writing values
      worksheet.getCell(`B${rowNumber}`).alignment = {
        horizontal: language === "AR" ? "right" : "left",
        vertical: "middle",
        wrapText: false,
      };
      worksheet.getCell(`I${rowNumber}`).alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getCell(`K${rowNumber}`).alignment = { horizontal: "center", vertical: "middle" };

      // Apply font and borders to all cells in material row
      const allCols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

      allCols.forEach((col) => {
        const cell = worksheet.getCell(`${col}${rowNumber}`);

        // Apply Calibri font size 14 bold to all cells
        cell.font = {
          name: "Calibri",
          size: 14,
          bold: true,
        };

        // Apply outer border to all cells
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      });

      worksheet.getRow(rowNumber).commit();
    });

    // ═══════════════════════════════
    // STEP 4: Calculate totals
    // ═══════════════════════════════

    const lastMaterialRow = startRow + items.length - 1;

    const totalHt = items.reduce((sum, item) => sum + parseFloat(item.total_ht || 0), 0);

    const totalTtc = items.reduce((sum, item) => sum + parseFloat(item.total_ttc || 0), 0);

    const exo = items
      .filter((item) => parseFloat(item.tva) === 0)
      .reduce((sum, item) => sum + parseFloat(item.total_ht || 0), 0);

    const htva9 = items
      .filter((item) => parseFloat(item.tva) === 9)
      .reduce((sum, item) => sum + parseFloat(item.total_ht || 0), 0);

    const htva19 = items
      .filter((item) => parseFloat(item.tva) === 19)
      .reduce((sum, item) => sum + parseFloat(item.total_ht || 0), 0);

    const tva9 = round2(htva9 * 0.09);
    const tva19 = round2(htva19 * 0.19);

    // ═══════════════════════════════
    // STEP 5: Write totals AFTER last material row
    // ═══════════════════════════════

    const totalHtRow = lastMaterialRow + 1;
    const exoRow = lastMaterialRow + 2;
    const tva9Row = lastMaterialRow + 3;
    const tva19Row = lastMaterialRow + 4;
    const totalTtcRow = lastMaterialRow + 5;

    // Restore styles from saved total rows
    if (savedTotalRows && originalTotalsStartRow) {
      const mapping = {
        [totalHtRow]: originalTotalsStartRow,
        [exoRow]: originalTotalsStartRow + 1,
        [tva9Row]: originalTotalsStartRow + 2,
        [tva19Row]: originalTotalsStartRow + 3,
        [totalTtcRow]: originalTotalsStartRow + 4,
      };

      Object.entries(mapping).forEach(([newRow, origRow]) => {
        const saved = savedTotalRows[parseInt(origRow)];
        if (saved) {
          saved.forEach(({ col, value, style }) => {
            const cell = worksheet.getCell(parseInt(newRow), col);
            const placeholders = ["totalht", "exo", "htva9", "tva9", "htva19", "tva19", "totalttc"];
            if (!placeholders.includes(value)) {
              cell.value = value;
            }
            try {
              cell.style = style;
            } catch (e) {
              // ignore, cell keeps its default style
            }
          });
        }
      });
    }

    // Set actual values
    worksheet.getCell(`K${totalHtRow}`).value = round2(totalHt);
    worksheet.getCell(`K${totalHtRow}`).numFmt = "#,##0.00";

    // H column in totalHtRow: merge H, I, J → label "TOTAL HT"
    try {
      worksheet.unMergeCells(`H${totalHtRow}:J${totalHtRow}`);
    } catch (e) {
      // ignore
    }
    worksheet.mergeCells(`H${totalHtRow}:J${totalHtRow}`);
    worksheet.getCell(`H${totalHtRow}`).value = "TOTAL HT";
    worksheet.getCell(`H${totalHtRow}`).font = { name: "Calibri", size: 14, bold: true };
    worksheet.getCell(`H${totalHtRow}`).alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell(`H${totalHtRow}`).border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };

    // Also merge K and L for totalHtRow
    try {
      worksheet.unMergeCells(`K${totalHtRow}:L${totalHtRow}`);
    } catch (e) {
      // ignore
    }
    worksheet.mergeCells(`K${totalHtRow}:L${totalHtRow}`);
    worksheet.getCell(`K${totalHtRow}`).font = { name: "Calibri", size: 14, bold: true };
    worksheet.getCell(`K${totalHtRow}`).alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell(`K${totalHtRow}`).border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };

    // Clear columns A to G in totalHtRow
    ["A", "B", "C", "D", "E", "F", "G"].forEach((col) => {
      const cell = worksheet.getCell(`${col}${totalHtRow}`);
      cell.value = null;
      cell.style = {};
    });

    // ═══════════════════════════════
    // FORMAT EXO ROW
    // ═══════════════════════════════

    // H column: merge H, I, J → label "EXO"
    try {
      worksheet.unMergeCells(`H${exoRow}:J${exoRow}`);
    } catch (e) {
      // ignore
    }
    worksheet.mergeCells(`H${exoRow}:J${exoRow}`);
    worksheet.getCell(`H${exoRow}`).value = "EXO";
    worksheet.getCell(`H${exoRow}`).font = { name: "Calibri", size: 14, bold: true };
    worksheet.getCell(`H${exoRow}`).alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell(`H${exoRow}`).border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };

    // K column: merge K and L → exo value with 2 decimal places
    try {
      worksheet.unMergeCells(`K${exoRow}:L${exoRow}`);
    } catch (e) {
      // ignore
    }
    worksheet.mergeCells(`K${exoRow}:L${exoRow}`);
    worksheet.getCell(`K${exoRow}`).value = round2(exo);
    worksheet.getCell(`K${exoRow}`).numFmt = "#,##0.00";
    worksheet.getCell(`K${exoRow}`).font = { name: "Calibri", size: 14, bold: true };
    worksheet.getCell(`K${exoRow}`).alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell(`K${exoRow}`).border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };

    worksheet.getCell(`I${tva9Row}`).value = round2(htva9);
    worksheet.getCell(`I${tva9Row}`).numFmt = "#,##0.00";
    worksheet.getCell(`K${tva9Row}`).value = tva9;
    worksheet.getCell(`K${tva9Row}`).numFmt = "#,##0.00";
    worksheet.getCell(`I${tva19Row}`).value = round2(htva19);
    worksheet.getCell(`I${tva19Row}`).numFmt = "#,##0.00";
    worksheet.getCell(`K${tva19Row}`).value = tva19;
    worksheet.getCell(`K${tva19Row}`).numFmt = "#,##0.00";
    // ═══════════════════════════════
    // FORMAT TOTAL TTC ROW
    // ═══════════════════════════════

    // H column: merge H, I, J → label "TOTAL TTC"
    try {
      worksheet.unMergeCells(`H${totalTtcRow}:J${totalTtcRow}`);
    } catch (e) {
      // ignore
    }
    worksheet.mergeCells(`H${totalTtcRow}:J${totalTtcRow}`);
    worksheet.getCell(`H${totalTtcRow}`).value = "TOTAL TTC";
    worksheet.getCell(`H${totalTtcRow}`).font = { name: "Calibri", size: 14, bold: true };
    worksheet.getCell(`H${totalTtcRow}`).alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell(`H${totalTtcRow}`).border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };

    // K column: merge K and L → totalTtc value
    try {
      worksheet.unMergeCells(`K${totalTtcRow}:L${totalTtcRow}`);
    } catch (e) {
      // ignore
    }
    worksheet.mergeCells(`K${totalTtcRow}:L${totalTtcRow}`);
    worksheet.getCell(`K${totalTtcRow}`).value = round2(totalTtc);
    worksheet.getCell(`K${totalTtcRow}`).numFmt = "#,##0.00";
    worksheet.getCell(`K${totalTtcRow}`).font = { name: "Calibri", size: 14, bold: true };
    worksheet.getCell(`K${totalTtcRow}`).alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell(`K${totalTtcRow}`).border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };

    // Clear columns A to G in totalTtc row
    ["A", "B", "C", "D", "E", "F", "G"].forEach((col) => {
      const cell = worksheet.getCell(`${col}${totalTtcRow}`);
      cell.value = null;
      cell.style = {};
    });

    // ═══════════════════════════════
    // FORMAT TVA ROWS
    // ═══════════════════════════════

    // TVA 9% row
    // H column: label "TVA 9%"
    worksheet.getCell(`H${tva9Row}`).value = "TVA 9%";
    worksheet.getCell(`H${tva9Row}`).font = { name: "Calibri", size: 14, bold: true };
    worksheet.getCell(`H${tva9Row}`).alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell(`H${tva9Row}`).border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };

    // I column: htva9 value (merge I and J)
    try {
      worksheet.unMergeCells(`I${tva9Row}:J${tva9Row}`);
    } catch (e) {
      // ignore
    }
    worksheet.mergeCells(`I${tva9Row}:J${tva9Row}`);
    worksheet.getCell(`I${tva9Row}`).value = round2(htva9);
    worksheet.getCell(`I${tva9Row}`).numFmt = "#,##0.00";
    worksheet.getCell(`I${tva9Row}`).font = { name: "Calibri", size: 14, bold: true };
    worksheet.getCell(`I${tva9Row}`).alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell(`I${tva9Row}`).border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };

    // TVA 19% row
    // H column: label "TVA 19%"
    worksheet.getCell(`H${tva19Row}`).value = "TVA 19%";
    worksheet.getCell(`H${tva19Row}`).font = { name: "Calibri", size: 14, bold: true };
    worksheet.getCell(`H${tva19Row}`).alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell(`H${tva19Row}`).border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };

    // I column: htva19 value (merge I and J)
    try {
      worksheet.unMergeCells(`I${tva19Row}:J${tva19Row}`);
    } catch (e) {
      // ignore
    }
    worksheet.mergeCells(`I${tva19Row}:J${tva19Row}`);
    worksheet.getCell(`I${tva19Row}`).value = round2(htva19);
    worksheet.getCell(`I${tva19Row}`).numFmt = "#,##0.00";
    worksheet.getCell(`I${tva19Row}`).font = { name: "Calibri", size: 14, bold: true };
    worksheet.getCell(`I${tva19Row}`).alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell(`I${tva19Row}`).border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };

    // K column: merge K and L for tva9 value
    try {
      worksheet.unMergeCells(`K${tva9Row}:L${tva9Row}`);
    } catch (e) {
      // ignore
    }
    worksheet.mergeCells(`K${tva9Row}:L${tva9Row}`);
    worksheet.getCell(`K${tva9Row}`).value = tva9;
    worksheet.getCell(`K${tva9Row}`).numFmt = "#,##0.00";
    worksheet.getCell(`K${tva9Row}`).font = { name: "Calibri", size: 14, bold: true };
    worksheet.getCell(`K${tva9Row}`).alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell(`K${tva9Row}`).border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };

    // K column: merge K and L for tva19 value
    try {
      worksheet.unMergeCells(`K${tva19Row}:L${tva19Row}`);
    } catch (e) {
      // ignore
    }
    worksheet.mergeCells(`K${tva19Row}:L${tva19Row}`);
    worksheet.getCell(`K${tva19Row}`).value = tva19;
    worksheet.getCell(`K${tva19Row}`).numFmt = "#,##0.00";
    worksheet.getCell(`K${tva19Row}`).font = { name: "Calibri", size: 14, bold: true };
    worksheet.getCell(`K${tva19Row}`).alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell(`K${tva19Row}`).border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };

    // Always show these rows even if values are 0
    // (already handled since we always write the values)

    // Also apply 2 decimal places to material rows K column (total per material)
    items.forEach((item, index) => {
      const rowNumber = startRow + index;
      worksheet.getCell(`K${rowNumber}`).numFmt = "#,##0.00";
      worksheet.getCell(`I${rowNumber}`).numFmt = "#,##0.00";
    });

    // ═══════════════════════════════
    // STEP 6: Clear everything below totalttc row
    // ═══════════════════════════════

    for (let rowNum = totalTtcRow + 1; rowNum <= totalTemplateRows; rowNum++) {
      const row = worksheet.getRow(rowNum);
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.value = null;
        cell.style = {};
      });
      row.height = undefined;
      row.commit();
    }

    // Set row height to 24 for all rows from startRow to totalTtcRow
    for (let rowNum = startRow; rowNum <= totalTtcRow; rowNum++) {
      worksheet.getRow(rowNum).height = 24;
    }

    // Generate filename and save
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;

    const filename =
      language === "AR"
        ? `فاتورة_${invoice.reference}_${dateStr}.xlsx`
        : `Facture_${invoice.reference}_${dateStr}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, filename);
  } catch (error) {
    console.error("Invoice Excel export error:", error);
    throw error;
  }
}

export default exportInvoiceExcel;
