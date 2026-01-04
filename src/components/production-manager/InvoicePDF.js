// src/components/production-manager/InvoicePDF.js
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    alignItems: "center",
  },
  logo: { width: 140, height: 140, marginBottom: 10, objectFit: "contain" },
  branding: { fontSize: 11, fontWeight: "bold", lineHeight: 1.4 },
  title: {
    fontSize: 32,
    fontWeight: "black",
    textTransform: "uppercase",
    letterSpacing: -1,
    color: "#0f172a",
  },
  projectBar: {
    backgroundColor: "#0f172a",
    color: "#fff",
    padding: 12,
    marginBottom: 20,
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: 2,
    borderColor: "#0f172a",
    paddingBottom: 6,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#f1f5f9",
    paddingVertical: 10,
  },
  totalSection: {
    marginTop: 25,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalBox: {
    width: 200,
    borderTop: 2,
    borderColor: "#0f172a",
    paddingTop: 10,
  },
  grandTotal: { fontSize: 18, fontWeight: "bold", color: "#059669" },

  // SMALLER, REFINED PAYMENT BUTTON
  payLink: {
    marginTop: 20,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  payButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    backgroundColor: "#2563eb",
    borderRadius: 6,
    textAlign: "center",
  },
  payText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  noteSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
  },
  footer: {
    marginTop: "auto",
    borderTop: 1,
    borderColor: "#e2e8f0",
    paddingTop: 15,
    fontSize: 8,
    color: "#94a3b8",
  },
});

export default function InvoicePDF({ project, data, calcs }) {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);

  // Sanitizer to prevent URL appending
  const sanitizeUrl = (url) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `https://${url}`;
  };

  const getRealTime = (decimalHours) => {
    const totalSeconds = Math.floor(decimalHours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Image src="/images/dndl-logo.png" style={styles.logo} />
            <Text style={styles.branding}>DnDL Creative LLC</Text>
            <Text>DBA Daniel (not Day) Lewis</Text>
            <Text>6809 Main St. #1118</Text>
            <Text>Cincinnati, Ohio 45244</Text>
          </View>
          <View style={{ alignItems: "right" }}>
            <Text style={styles.title}>Invoice</Text>
            <Text style={{ marginTop: 5, fontWeight: "bold" }}>
              Ref #: {project.ref_number || "N/A"}
            </Text>
            <Text>Date: {data.invoiced_date}</Text>
          </View>
        </View>

        <View style={styles.projectBar}>
          <Text style={{ fontSize: 12, fontWeight: "bold" }}>
            PROJECT: {project.book_title}
          </Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={{ flex: 3, fontWeight: "bold" }}>Description</Text>
          <Text style={{ flex: 1, textAlign: "right", fontWeight: "bold" }}>
            Qty/Hrs
          </Text>
          <Text style={{ flex: 1, textAlign: "right", fontWeight: "bold" }}>
            Rate
          </Text>
          <Text style={{ flex: 1, textAlign: "right", fontWeight: "bold" }}>
            Total
          </Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={{ flex: 3 }}>Audiobook Production (Performance)</Text>
          <Text style={{ flex: 1, textAlign: "right" }}>{data.pfh_count}</Text>
          <Text style={{ flex: 1, textAlign: "right" }}>
            {formatCurrency(data.pfh_rate)}
          </Text>
          <Text style={{ flex: 1, textAlign: "right" }}>
            {formatCurrency(calcs.base)}
          </Text>
        </View>

        {Number(calcs.sag) > 0 && (
          <View style={styles.tableRow}>
            <Text style={{ flex: 3 }}>
              SAG-AFTRA P&H Contribution ({data.sag_ph_percent}%)
            </Text>
            <Text style={{ flex: 1, textAlign: "right" }}>-</Text>
            <Text style={{ flex: 1, textAlign: "right" }}>-</Text>
            <Text style={{ flex: 1, textAlign: "right" }}>
              {formatCurrency(calcs.sag)}
            </Text>
          </View>
        )}

        {/* FIXED MULTI-PERFORMER ROW */}
        {Number(data.convenience_fee) > 0 && (
          <View style={styles.tableRow}>
            <Text style={{ flex: 3 }}>Multi-Performer Flat Rate</Text>
            <Text style={{ flex: 1, textAlign: "right" }}>-</Text>
            <Text style={{ flex: 1, textAlign: "right" }}>-</Text>
            <Text style={{ flex: 1, textAlign: "right" }}>
              {formatCurrency(data.convenience_fee)}
            </Text>
          </View>
        )}

        <View style={styles.totalSection}>
          <View style={styles.totalBox}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontWeight: "bold" }}>TOTAL DUE:</Text>
              <Text style={styles.grandTotal}>
                {formatCurrency(calcs.total)}
              </Text>
            </View>
          </View>
        </View>

        {/* CLICKABLE LINK FIX */}
        {data.payment_link && (
          <View style={styles.payLink}>
            <Link
              src={sanitizeUrl(data.payment_link)}
              style={{ textDecoration: "none" }}
            >
              <View style={styles.payButton}>
                <Text style={styles.payText}>Pay Online</Text>
              </View>
            </Link>
          </View>
        )}

        <View style={styles.noteSection}>
          <Text
            style={{
              fontSize: 8,
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            Notes
          </Text>
          <Text>Real Audio Runtime: {getRealTime(data.pfh_count)}</Text>
          {data.custom_note && (
            <Text style={{ marginTop: 5 }}>{data.custom_note}</Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text>
            NET 15: Payment due by {data.due_date}. Thank you for your business.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
