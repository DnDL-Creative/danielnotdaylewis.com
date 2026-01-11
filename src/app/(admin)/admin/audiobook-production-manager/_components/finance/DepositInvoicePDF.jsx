"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#334155",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  brand: {
    fontSize: 24,
    fontWeight: "heavy",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  subBrand: { fontSize: 10, color: "#94a3b8", marginTop: 4 },
  invoiceTitle: {
    fontSize: 28,
    textTransform: "uppercase",
    textAlign: "right",
    fontWeight: "heavy",
  },
  meta: { marginTop: 8, textAlign: "right", fontSize: 10, color: "#64748b" },
  billTo: {
    marginTop: 20,
    marginBottom: 30,
    padding: 15,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  label: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#94a3b8",
    marginBottom: 4,
    fontWeight: "bold",
  },
  value: { fontSize: 12, color: "#0f172a", marginBottom: 2 },

  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 8,
    marginTop: 20,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  colDesc: { width: "70%" },
  colTotal: { width: "30%", textAlign: "right" },

  totalSection: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase" },
  totalValue: { fontSize: 14, fontWeight: "heavy" },

  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 20,
  },
  logo: { width: 50, height: 50, marginBottom: 10 },
});

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value || 0
  );

export default function DepositInvoicePDF({ project, data }) {
  const isRefund = data.deposit_status === "refunded" || data.is_refund_view;
  const title = isRefund ? "REFUND RECEIPT" : "DEPOSIT INVOICE";
  const color = isRefund ? "#ef4444" : "#2563eb"; // Red for refund, Blue for deposit

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            {data.logo_url && <Image src={data.logo_url} style={styles.logo} />}
            <Text style={styles.brand}>AUDIOBOOK PRO</Text>
            <Text style={styles.subBrand}>Production Services</Text>
          </View>
          <View>
            <Text style={{ ...styles.invoiceTitle, color: color }}>
              {title}
            </Text>
            <Text style={styles.meta}>Ref: {project.ref_number}-DEP</Text>
            <Text style={styles.meta}>
              Date: {new Date().toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* BILL TO */}
        <View style={styles.billTo}>
          <Text style={styles.label}>Bill To</Text>
          <Text style={styles.value}>
            {project.author_name || "Unknown Author"}
          </Text>
          <Text style={{ fontSize: 10, color: "#64748b" }}>
            Project: {project.book_title}
          </Text>
        </View>

        {/* TABLE */}
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>DESCRIPTION</Text>
          <Text style={styles.colTotal}>AMOUNT</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.colDesc}>
            {isRefund
              ? `Refund of Deposit for Project: ${project.book_title}`
              : `Upfront Production Deposit for Project: ${project.book_title}`}
          </Text>
          <Text style={styles.colTotal}>
            {formatCurrency(data.deposit_amount)}
          </Text>
        </View>

        {/* TOTALS */}
        <View style={styles.totalSection}>
          <View
            style={{
              width: 200,
              borderTopWidth: 2,
              borderTopColor: color,
              paddingTop: 10,
            }}
          >
            <View style={styles.totalRow}>
              <Text style={{ ...styles.totalLabel, color: color }}>
                TOTAL {isRefund ? "REFUNDED" : "DUE"}
              </Text>
              <Text style={{ ...styles.totalValue, color: color }}>
                {formatCurrency(data.deposit_amount)}
              </Text>
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={{ fontSize: 8, color: "#94a3b8" }}>
            {isRefund
              ? "This document confirms the refund of your deposit."
              : "Please remit payment to secure production start date."}
          </Text>
          {data.payment_link && !isRefund && (
            <Text style={{ fontSize: 9, marginTop: 5, color: "#2563eb" }}>
              Pay online: {data.payment_link}
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
}
