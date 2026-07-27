const printReceiptPDF = (receipt, items, language = "AR") => {
  // Calculate totals
  const totalHt = items.reduce(
    (sum, item) => sum + parseFloat(item.quantity) * parseFloat(item.unit_price),
    0
  );
  const totalTtc = items.reduce(
    (sum, item) =>
      sum + parseFloat(item.quantity) * parseFloat(item.unit_price) * (1 + parseFloat(item.tva) / 100),
    0
  );

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  };

  // Format number
  const formatNum = (value) =>
    parseFloat(value || 0).toLocaleString("fr-DZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Build materials rows HTML
  const materialsRows = items
    .map(
      (item, index) => `
      <tr>
        <td class="center">${index + 1}</td>
        <td class="center">${formatNum(item.quantity)}</td>
        <td>${item.name_ar || ""}</td>
        <td class="center" colspan="4">${formatNum(item.unit_price)}</td>
        <td class="center" colspan="2">${formatNum(item.quantity * item.unit_price)}</td>
      </tr>
    `
    )
    .join("");

  // Build full HTML page
  const htmlContent = `
    <!DOCTYPE html>
    <html dir="${language === "AR" ? "rtl" : "ltr"}"
          lang="${language === "AR" ? "ar" : "fr"}">
    <head>
      <meta charset="UTF-8">
      <title>وصل ${receipt.reference}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Arial', sans-serif;
          font-size: 12px;
          padding: 20px;
          direction: ${language === "AR" ? "rtl" : "ltr"};
        }

        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }

        .header-info {
          width: 100%;
          margin-bottom: 15px;
        }

        .header-info td {
          padding: 3px 6px;
          font-size: 12px;
        }

        .main-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        .main-table th {
          border: 1px solid #000;
          padding: 5px;
          text-align: center;
          background-color: #f0f0f0;
          font-weight: bold;
        }

        .main-table td {
          border: 1px solid #000;
          padding: 5px;
          min-height: 20px;
        }

        .main-table td.center {
          text-align: center;
        }

        .thank-you-row td {
          text-align: center;
          font-weight: bold;
          font-size: 13px;
          padding: 8px;
          border: 1px solid #000;
        }

        .totals-row td {
          font-weight: bold;
          border: 1px solid #000;
          padding: 5px;
          text-align: center;
        }

        .reference {
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 10px;
          border: 2px solid #000;
          padding: 5px;
        }

        @media print {
          body { padding: 10px; }
          @page { margin: 1cm; }
        }
      </style>
    </head>
    <body>

      <!-- Receipt Reference -->
      <div class="reference">وصل رقم: ${receipt.reference}</div>

      <!-- Header Info -->
      <table class="header-info">
        <tr>
          <td><strong>المستخدم:</strong> ${receipt.created_by_name || ""}</td>
          <td><strong>رقم الهاتف:</strong> ${receipt.contractor_phone || ""}</td>
        </tr>
        <tr>
          <td><strong>يسلّم إلى:</strong> ${receipt.branch_name || ""}</td>
          <td><strong>التاريخ:</strong> ${formatDate(receipt.receipt_date)}</td>
        </tr>
        <tr>
          <td><strong>المتعامل:</strong> ${receipt.contractor_name || ""}</td>
          <td><strong>المصلحة:</strong> ${receipt.authority_name || ""}</td>
        </tr>
      </table>

      <!-- Materials Table -->
      <table class="main-table">
        <thead>
          <tr>
            <th>رقم</th>
            <th>الكمية</th>
            <th>التسمية</th>
            <th colspan="4">السعر الوحدوي</th>
            <th colspan="2">المجموع</th>
          </tr>
        </thead>
        <tbody>
          ${materialsRows}

          <!-- Thank you + Totals row -->
          <tr class="thank-you-row">
            <td colspan="6">شكــــــــــرا على ثقــــــــــتكم</td>
            <td colspan="1" class="totals-row">
              <div>المجموع HT</div>
              <div>${formatNum(totalHt)} دج</div>
            </td>
            <td colspan="2" class="totals-row">
              <div>المجموع TTC</div>
              <div>${formatNum(totalTtc)} دج</div>
            </td>
          </tr>
        </tbody>
      </table>

    </body>
    </html>
  `;

  // Open in new window and trigger print
  const printWindow = window.open("", "_blank", "width=900,height=700");
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
};

export default printReceiptPDF;
