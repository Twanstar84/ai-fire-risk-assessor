import { Assessment, Finding, ConversationHistory } from "../drizzle/schema";

export interface ReportData {
  assessment: Assessment | null;
  findings: Finding[];
  conversation: ConversationHistory[];
  generatedAt: string;
}

/**
 * Generate a UK RRFSO 2005 compliant HTML report that can be converted to PDF
 */
export function generateReportHTML(reportData: ReportData): string {
  const { assessment, findings, conversation, generatedAt } = reportData;

  if (!assessment) {
    return "<h1>Assessment not found</h1>";
  }

  // Calculate risk level based on findings
  const riskLevels = findings.map((f) => f.severity || "observation");
  let overallRisk = "Low";
  if (riskLevels.includes("critical")) overallRisk = "Critical";
  else if (riskLevels.includes("major")) overallRisk = "High";
  else if (riskLevels.includes("minor")) overallRisk = "Medium";

  const findingsHTML = findings
    .map(
      (f) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${f.category || ""}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${f.title || ""} - ${f.description || ""}</td>
      <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: ${getSeverityColor(f.severity)}">${ f.severity || "observation"}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${f.recommendedAction || ""}</td>
    </tr>
  `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Fire Risk Assessment Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 20px;
        }
        .header {
          border-bottom: 3px solid #003366;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          color: #003366;
        }
        .header p {
          margin: 5px 0;
          font-size: 14px;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section h2 {
          background-color: #f0f0f0;
          padding: 10px;
          border-left: 4px solid #003366;
          margin-top: 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background-color: #003366;
          color: white;
          padding: 10px;
          text-align: left;
          font-weight: bold;
        }
        td {
          border: 1px solid #ddd;
          padding: 8px;
        }
        .info-box {
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          padding: 10px;
          margin-bottom: 10px;
        }
        .critical { color: #d32f2f; font-weight: bold; }
        .major { color: #f57c00; font-weight: bold; }
        .minor { color: #fbc02d; font-weight: bold; }
        .observation { color: #388e3c; font-weight: bold; }
        .risk-level {
          font-size: 24px;
          font-weight: bold;
          padding: 10px;
          border-radius: 5px;
          display: inline-block;
          margin: 10px 0;
        }
        .risk-critical { background-color: #ffcdd2; color: #d32f2f; }
        .risk-high { background-color: #ffe0b2; color: #f57c00; }
        .risk-medium { background-color: #fff9c4; color: #fbc02d; }
        .risk-low { background-color: #c8e6c9; color: #388e3c; }
        .footer {
          margin-top: 40px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Fire Risk Assessment Report</h1>
        <p><strong>UK Regulatory Reform (Fire Safety) Order 2005</strong></p>
        <p>Generated: ${new Date(generatedAt).toLocaleString()}</p>
      </div>

      <div class="section">
        <h2>1. Building Information</h2>
        <table>
          <tr>
            <th>Property</th>
            <th>Details</th>
          </tr>
          <tr>
            <td><strong>Building Name</strong></td>
            <td>${assessment.buildingName || "N/A"}</td>
          </tr>
          <tr>
            <td><strong>Address</strong></td>
            <td>${assessment.address || "N/A"}</td>
          </tr>
          <tr>
            <td><strong>Building Type</strong></td>
            <td>${assessment.buildingType || "N/A"}</td>
          </tr>
          <tr>
            <td><strong>Occupancy Type</strong></td>
            <td>${assessment.occupancyType || "N/A"}</td>
          </tr>
          <tr>
            <td><strong>Assessment Date</strong></td>
            <td>${new Date(assessment.assessmentDate).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td><strong>Status</strong></td>
            <td>${assessment.status || "Draft"}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>2. Overall Risk Assessment</h2>
        <div class="risk-level risk-${overallRisk.toLowerCase()}">
          Overall Risk Level: ${overallRisk}
        </div>
        <p>Based on ${findings.length} findings identified during the assessment.</p>
      </div>

      <div class="section">
        <h2>3. Assessment Findings</h2>
        ${findings.length > 0 ? `
        <table>
          <tr>
            <th>Category</th>
            <th>Finding</th>
            <th>Severity</th>
            <th>Recommended Action</th>
          </tr>
          ${findingsHTML}
        </table>
        ` : "<p>No findings recorded yet.</p>"}
      </div>

      <div class="section">
        <h2>4. Findings Summary</h2>
        <div class="info-box">
          <p><strong>Critical Issues:</strong> ${findings.filter((f) => f.severity === "critical").length}</p>
          <p><strong>Major Issues:</strong> ${findings.filter((f) => f.severity === "major").length}</p>
          <p><strong>Minor Issues:</strong> ${findings.filter((f) => f.severity === "minor").length}</p>
          <p><strong>Observations:</strong> ${findings.filter((f) => f.severity === "observation").length}</p>
        </div>
      </div>

      <div class="section">
        <h2>5. Assessment Conversation Summary</h2>
        <p>Total interactions: ${conversation.length}</p>
        <p>This assessment was conducted through a guided conversation with an AI fire safety expert, ensuring systematic coverage of all relevant fire safety areas under the RRFSO 2005.</p>
      </div>

      <div class="footer">
        <p>This report is generated by the Automated Fire Risk Assessment System and should be reviewed by a qualified fire safety professional.</p>
        <p>Assessment ID: ${assessment.id} | Generated: ${new Date(generatedAt).toISOString()}</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

function getSeverityColor(severity?: string): string {
  switch (severity) {
    case "critical":
      return "#d32f2f";
    case "major":
      return "#f57c00";
    case "minor":
      return "#fbc02d";
    case "observation":
      return "#388e3c";
    default:
      return "#333";
  }
}
