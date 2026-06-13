import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generates a premium PDF Monthly Expense Report for the user.
 * 
 * @param {object} user - User object containing name and email.
 * @param {number} month - Selected month (1-12).
 * @param {number} year - Selected year (e.g., 2026).
 * @param {array} transactions - Array of transaction objects.
 * @param {array} budgets - Array of budget objects.
 */
export const generateMonthlyExpenseReport = (user, month, year, transactions, budgets) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const selectedMonthName = monthNames[month - 1];

  // Helper: Currency formatting (INR style but using safe 'INR' label to avoid font issues)
  const formatPDFCurrency = (value) => {
    const number = Number(value) || 0;
    return "INR " + number.toLocaleString("en-IN", {
      maximumFractionDigits: 0
    });
  };

  // Helper: Date formatting
  const formatPDFDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // --- 1. FILTER DATA BY SELECTED MONTH & YEAR ---
  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const monthlyBudgets = budgets.filter(b => b.month === month && b.year === year);

  // --- 2. CORE AGGREGATES ---
  const totalIncome = monthlyTransactions.reduce(
    (sum, t) => sum + (t.type === "income" ? Number(t.amount) || 0 : 0),
    0
  );
  const totalExpense = monthlyTransactions.reduce(
    (sum, t) => sum + (t.type === "expense" ? Number(t.amount) || 0 : 0),
    0
  );
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

  // Category totals (for expenses)
  const categoryTotals = {};
  monthlyTransactions.forEach(t => {
    if (t.type === "expense") {
      const cat = t.category || "Other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(t.amount) || 0);
    }
  });

  // PREDEFINED APP CATEGORIES
  const categoryOptions = ["Food", "Transport", "Shopping", "Entertainment", "Health", "Education", "Bills", "Other"];
  
  // Combine Budget & Actual data
  const budgetSummary = categoryOptions.map(catName => {
    const budgetObj = monthlyBudgets.find(b => b.category === catName);
    const limit = budgetObj ? budgetObj.limit : 0;
    const spent = categoryTotals[catName] || 0;
    const remaining = limit > 0 ? limit - spent : 0;
    const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    const status = limit === 0 ? "No Limit" : spent > limit ? "Exceeded" : "On Track";
    return {
      category: catName,
      limit,
      spent,
      remaining,
      percent,
      status
    };
  });

  // Top category spent
  let topCategory = "";
  let maxSpent = 0;
  Object.keys(categoryTotals).forEach(cat => {
    if (categoryTotals[cat] > maxSpent) {
      maxSpent = categoryTotals[cat];
      topCategory = cat;
    }
  });

  // --- 3. THEME COLORS & CONFIG (Fintech Premium Theme) ---
  const colors = {
    primary: [27, 8, 56],       // Deep Purple Navy (#1b0838)
    accent: [139, 92, 246],     // Violet (#8b5cf6)
    pinkAccent: [236, 72, 153], // Pink (#ec4899)
    darkGray: [30, 30, 36],     // Dark gray for text
    lightGray: [100, 100, 110], // Muted text gray
    bgLight: [248, 250, 252],   // Light bg for sections
    success: [16, 185, 129],    // Emerald Green
    danger: [244, 63, 94],      // Rose Red
    border: [226, 232, 240]     // Border gray
  };

  // Setup styles
  const addReportHeader = () => {
    // Header Banner block (deep purple background)
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, 0, 210, 38, "F");

    // Banner Accent Line (pink)
    doc.setFillColor(colors.pinkAccent[0], colors.pinkAccent[1], colors.pinkAccent[2]);
    doc.rect(0, 37, 210, 1, "F");

    // App Logo / Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("SMART EXPENSE LEDGER", 15, 16);

    // App Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 220);
    doc.text("Luxury Portfolio Analytics & Wealth Management", 15, 22);

    // Report Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("MONTHLY REPORT", 195, 16, { align: "right" });

    // Report Period
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(colors.pinkAccent[0], colors.pinkAccent[1], colors.pinkAccent[2]);
    doc.text(`${selectedMonthName.toUpperCase()} ${year}`, 195, 22, { align: "right" });
  };

  // Draw Header
  addReportHeader();

  // Meta Information Box
  let currentY = 47;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("Client Account:", 15, currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(colors.darkGray[0], colors.darkGray[1], colors.darkGray[2]);
  doc.text(`${user.name || "Valued User"} (${user.email || "N/A"})`, 43, currentY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("Generated on:", 135, currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(colors.darkGray[0], colors.darkGray[1], colors.darkGray[2]);
  const now = new Date();
  doc.text(`${now.toLocaleDateString("en-IN")} ${now.toLocaleTimeString("en-IN")}`, 162, currentY);

  // Divide line
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.4);
  doc.line(15, currentY + 4, 195, currentY + 4);

  // --- 4. SUMMARY METRICS CARDS GRID ---
  currentY += 10;
  
  const cardW = 42;
  const cardH = 20;
  const cardGap = 4;
  const startX = 15;

  const summaryCards = [
    { title: "TOTAL INCOME", val: formatPDFCurrency(totalIncome), color: colors.success },
    { title: "TOTAL EXPENSES", val: formatPDFCurrency(totalExpense), color: colors.danger },
    { title: "NET BALANCE", val: formatPDFCurrency(balance), color: balance >= 0 ? colors.success : colors.danger },
    { title: "SAVINGS RATE", val: `${savingsRate.toFixed(1)}%`, color: savingsRate >= 20 ? colors.accent : colors.pinkAccent }
  ];

  summaryCards.forEach((card, index) => {
    const cardX = startX + index * (cardW + cardGap);
    
    // Fill background
    doc.setFillColor(colors.bgLight[0], colors.bgLight[1], colors.bgLight[2]);
    doc.roundedRect(cardX, currentY, cardW, cardH, 2, 2, "F");

    // Draw card left accent border
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.rect(cardX, currentY, 1.5, cardH, "F");

    // Text details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
    doc.text(card.title, cardX + 4, currentY + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(colors.darkGray[0], colors.darkGray[1], colors.darkGray[2]);
    doc.text(card.val, cardX + 4, currentY + 13.5);
  });

  // --- 5. CATEGORY-WISE EXPENSE CHART & BREAKDOWN ---
  currentY += cardH + 10;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("Expense Distribution Chart (Category Breakdown)", 15, currentY);

  currentY += 4;

  // Render Horizontal Bar Chart using Vector drawing primitives
  const chartHeight = 52;
  const chartWidth = 180;
  
  doc.setFillColor(colors.bgLight[0], colors.bgLight[1], colors.bgLight[2]);
  doc.roundedRect(15, currentY, chartWidth, chartHeight, 2, 2, "F");

  // Filter out categories with 0 spent to present cleaner chart
  const activeBreakdown = budgetSummary.filter(c => c.spent > 0);
  
  if (activeBreakdown.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
    doc.text("No expense transactions recorded during this period.", 20, currentY + chartHeight / 2 + 3);
  } else {
    // Sort active breakdown desc
    activeBreakdown.sort((a, b) => b.spent - a.spent);
    
    const maxActiveSpent = Math.max(...activeBreakdown.map(c => c.spent));
    
    // Draw categories bars (Limit to top 5 categories in visual chart, but list all in table later)
    const displayLimit = Math.min(activeBreakdown.length, 5);
    const rowHeight = 8;
    const barStartX = 48;
    const maxBarWidth = 110;
    
    for (let i = 0; i < displayLimit; i++) {
      const rowY = currentY + 5 + i * (rowHeight + 1.5);
      const data = activeBreakdown[i];
      
      // Label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(colors.darkGray[0], colors.darkGray[1], colors.darkGray[2]);
      doc.text(data.category, 20, rowY + 5.5);
      
      // Bar background Track
      doc.setFillColor(235, 238, 243);
      doc.roundedRect(barStartX, rowY, maxBarWidth, rowHeight - 2, 1, 1, "F");
      
      // Fill bar width proportion
      const widthProportion = data.spent / Math.max(maxActiveSpent, 1);
      const fillWidth = widthProportion * maxBarWidth;
      
      // Assign custom color from app palette
      let fillCol = colors.accent;
      if (data.category === "Food") fillCol = [249, 115, 22]; // Orange
      else if (data.category === "Transport") fillCol = [59, 130, 246]; // Blue
      else if (data.category === "Shopping") fillCol = [236, 72, 153]; // Pink
      else if (data.category === "Bills") fillCol = [244, 63, 94]; // Rose
      else if (data.category === "Health") fillCol = [16, 185, 129]; // Emerald
      
      doc.setFillColor(fillCol[0], fillCol[1], fillCol[2]);
      if (fillWidth > 0) {
        doc.roundedRect(barStartX, rowY, fillWidth, rowHeight - 2, 1, 1, "F");
      }
      
      // Value label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(colors.darkGray[0], colors.darkGray[1], colors.darkGray[2]);
      const percentShare = ((data.spent / Math.max(totalExpense, 1)) * 100).toFixed(0);
      doc.text(`${formatPDFCurrency(data.spent)} (${percentShare}%)`, barStartX + maxBarWidth + 3, rowY + 5.5);
    }
  }

  // --- 6. BUDGETS SUMMARY TABLE ---
  currentY += chartHeight + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("Monthly Budget Planning Summary", 15, currentY);

  currentY += 4;

  const budgetTableHeaders = [["Category", "Budget Limit", "Amount Spent", "Remaining", "Spent %", "Status"]];
  const budgetTableRows = budgetSummary.map(b => {
    return [
      b.category,
      b.limit > 0 ? formatPDFCurrency(b.limit) : "No Limit",
      formatPDFCurrency(b.spent),
      b.limit > 0 ? formatPDFCurrency(b.remaining) : "—",
      b.limit > 0 ? `${b.percent.toFixed(0)}%` : "—",
      b.status
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: budgetTableHeaders,
    body: budgetTableRows,
    theme: "striped",
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 35 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
      5: { fontStyle: "bold" }
    },
    bodyStyles: {
      fontSize: 8.5
    },
    didParseCell: (data) => {
      // Color status labels
      if (data.column.index === 5 && data.cell.section === "body") {
        if (data.cell.raw === "Exceeded") {
          data.cell.styles.textColor = colors.danger;
        } else if (data.cell.raw === "On Track") {
          data.cell.styles.textColor = colors.success;
        } else {
          data.cell.styles.textColor = colors.lightGray;
        }
      }
      // Color remaining balances
      if (data.column.index === 3 && data.cell.section === "body") {
        const rawBudget = budgetSummary[data.row.index];
        if (rawBudget && rawBudget.limit > 0) {
          if (rawBudget.remaining < 0) {
            data.cell.styles.textColor = colors.danger;
          } else {
            data.cell.styles.textColor = colors.success;
          }
        }
      }
    },
    margin: { left: 15, right: 15 }
  });

  // --- 7. STRATEGIC SAVINGS INSIGHTS ---
  currentY = doc.lastAutoTable.finalY + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("Strategic Financial Insights & Action Plan", 15, currentY);

  currentY += 4;

  // Render Insights Container
  const insightBoxHeight = 35;
  doc.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  doc.setFillColor(colors.bgLight[0], colors.bgLight[1], colors.bgLight[2]);
  doc.roundedRect(15, currentY, 180, insightBoxHeight, 2, 2, "FD");

  // Determine dynamic advice based on metrics
  let insightSavingsText = "";
  if (savingsRate >= 20) {
    insightSavingsText = `Excellent! Savings Rate at ${savingsRate.toFixed(1)}% exceeds the 20% benchmark. Recommend transferring surplus to high-yield savings vaults.`;
  } else if (savingsRate > 0) {
    insightSavingsText = `Alert: Savings Rate is ${savingsRate.toFixed(1)}%. Aim to reach 20% by cutting discretionary wants or setting strict utility limits.`;
  } else {
    insightSavingsText = `Warning: Negative Savings Rate (${savingsRate.toFixed(1)}%). Expense ledger exceeds net incomes. Review all transactions immediately.`;
  }

  let insightCategoryText = "";
  if (topCategory && maxSpent > 0) {
    insightCategoryText = `Top spent: ${topCategory} costs total ${formatPDFCurrency(maxSpent)}. Trimming this category by 10% returns ${formatPDFCurrency(maxSpent * 0.1)} to balance.`;
  } else {
    insightCategoryText = "No categories recorded. Setup budget caps on top spending areas to organize your portfolio cashflows.";
  }

  let exceededCount = budgetSummary.filter(b => b.status === "Exceeded").length;
  let budgetWarningText = exceededCount > 0 
    ? `Budget alert: ${exceededCount} categories exceeded their configured thresholds. Tighten limits in the coming week.`
    : "Excellent: All category budget rules are inside target thresholds. Keep up the disciplined spend tracking.";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(colors.darkGray[0], colors.darkGray[1], colors.darkGray[2]);
  
  // Icon bullets using standard shapes
  const drawBullet = (bx, by, bColor) => {
    doc.setFillColor(bColor[0], bColor[1], bColor[2]);
    doc.circle(bx, by, 1.2, "F");
  };

  drawBullet(22, currentY + 8, savingsRate >= 20 ? colors.success : colors.danger);
  doc.text(insightSavingsText, 26, currentY + 9.5);

  drawBullet(22, currentY + 17, colors.accent);
  doc.text(insightCategoryText, 26, currentY + 18.5);

  drawBullet(22, currentY + 26, exceededCount > 0 ? colors.danger : colors.success);
  doc.text(budgetWarningText, 26, currentY + 27.5);

  // Footer function for drawing stamps & page counts
  const drawPageFooter = (pageNo, totalPages) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
    
    // Bottom divide line
    doc.setDrawColor(240, 240, 240);
    doc.line(15, 285, 195, 285);
    
    // Left: timestamp stamp
    doc.text(`Smart Expense Report | Generated on ${now.toLocaleDateString()}`, 15, 290);
    
    // Right: Page counts
    doc.text(`Page ${pageNo} of ${totalPages}`, 195, 290, { align: "right" });
  };

  // Stamp Page 1 Footer
  drawPageFooter(1, 2);

  // --- 8. PAGE 2: TRANSACTION LEDGER ---
  doc.addPage();
  
  // Header on Page 2
  addReportHeader();
  
  let p2Y = 47;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("Monthly Transaction History Ledger", 15, p2Y);

  p2Y += 4;

  const ledgerHeaders = [["Date", "Title / Description", "Category", "Type", "Amount"]];
  
  // Sort transactions by date descending
  const sortedTransactions = [...monthlyTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const ledgerRows = sortedTransactions.map(t => {
    const formattedAmount = `${t.type === "expense" ? "-" : "+"}${formatPDFCurrency(t.amount).replace("INR ", "")}`;
    return [
      formatPDFDate(t.date),
      t.title || "Transaction",
      t.category || "Other",
      t.type.toUpperCase(),
      formattedAmount
    ];
  });

  autoTable(doc, {
    startY: p2Y,
    head: ledgerHeaders,
    body: ledgerRows,
    theme: "striped",
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { fontStyle: "bold", cellWidth: 55 },
      2: { cellWidth: 35 },
      3: { cellWidth: 25 },
      4: { fontStyle: "bold", halign: "right", cellWidth: 30 }
    },
    bodyStyles: {
      fontSize: 8
    },
    didParseCell: (data) => {
      // Color Amounts in table column 4
      if (data.column.index === 4 && data.cell.section === "body") {
        const rawType = ledgerRows[data.row.index][3];
        if (rawType === "INCOME") {
          data.cell.styles.textColor = colors.success;
        } else {
          data.cell.styles.textColor = colors.danger;
        }
      }
      // Color Types in table column 3
      if (data.column.index === 3 && data.cell.section === "body") {
        if (data.cell.raw === "INCOME") {
          data.cell.styles.textColor = colors.success;
        } else {
          data.cell.styles.textColor = [190, 120, 20];
        }
      }
    },
    margin: { left: 15, right: 15 }
  });

  // Calculate dynamic page total
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    // Draw page header if past page 2, but we draw page 2 header and footer manually
    drawPageFooter(i, pageCount);
  }
  
  // Set page 1 footer with correct total page count
  doc.setPage(1);
  drawPageFooter(1, pageCount);

  // Trigger Save download
  const filename = `Expense_Report_${selectedMonthName}_${year}.pdf`;
  doc.save(filename);
};
