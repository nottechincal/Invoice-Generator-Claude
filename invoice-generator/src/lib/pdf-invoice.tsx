import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: 2,
    borderBottomColor: '#667eea',
    paddingBottom: 20,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 10,
    color: '#1f2937',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 8,
    borderBottom: 2,
    borderBottomColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableColHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  tableCol: {
    fontSize: 10,
    color: '#1f2937',
  },
  descCol: { width: '40%' },
  qtyCol: { width: '15%', textAlign: 'right' },
  priceCol: { width: '15%', textAlign: 'right' },
  taxCol: { width: '15%', textAlign: 'right' },
  totalCol: { width: '15%', textAlign: 'right' },
  totalsSection: {
    marginLeft: 'auto',
    width: '50%',
    marginTop: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9fafb',
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: 1,
    borderTopColor: '#e5e7eb',
  },
  footerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  footerText: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  statusBadge: {
    padding: '4 12',
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#065f46',
    textTransform: 'uppercase',
  },
  bankDetails: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 4,
    marginTop: 20,
  },
  bankTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 6,
  },
  bankText: {
    fontSize: 9,
    color: '#1e40af',
    marginBottom: 3,
  },
});

interface InvoicePDFProps {
  invoice: any;
  company: any;
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, company }) => {
  const formatCurrency = (amount: number) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Safely parse addresses and bankDetails
  const addresses = Array.isArray(company.addresses) ? company.addresses : [];
  const bankDetails = Array.isArray(company.bankDetails) ? company.bankDetails : [];
  const firstAddress = addresses.length > 0 ? addresses[0] : null;
  const firstBankAccount = bankDetails.length > 0 ? bankDetails[0] : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>
            {company.legalName || company.tradingName || 'Your Company'}
          </Text>
          {company.taxNumber && (
            <Text style={styles.companyDetails}>ABN: {company.taxNumber}</Text>
          )}
          {company.registrationNumber && (
            <Text style={styles.companyDetails}>ACN: {company.registrationNumber}</Text>
          )}
          {firstAddress && (
            <>
              <Text style={styles.companyDetails}>
                {firstAddress.street}
              </Text>
              <Text style={styles.companyDetails}>
                {firstAddress.city} {firstAddress.state} {firstAddress.postalCode}
              </Text>
            </>
          )}
          {company.email && (
            <Text style={styles.companyDetails}>{company.email}</Text>
          )}
          {company.phone && (
            <Text style={styles.companyDetails}>{company.phone}</Text>
          )}
        </View>

        {/* Invoice Title and Status */}
        <View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>Invoice #{invoice.number}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{invoice.status}</Text>
          </View>
        </View>

        {/* Customer and Invoice Details */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.value}>
              {invoice.customer.companyName || invoice.customer.name}
            </Text>
            {invoice.customer.companyName && (
              <Text style={styles.label}>Attn: {invoice.customer.name}</Text>
            )}
            {invoice.customer.email && (
              <Text style={styles.label}>{invoice.customer.email}</Text>
            )}
            {invoice.customer.phone && (
              <Text style={styles.label}>{invoice.customer.phone}</Text>
            )}
          </View>
          <View style={styles.col}>
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.label}>Issue Date</Text>
              <Text style={styles.value}>{formatDate(invoice.issueDate)}</Text>
            </View>
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.label}>Due Date</Text>
              <Text style={styles.value}>{formatDate(invoice.dueDate)}</Text>
            </View>
            <View>
              <Text style={styles.label}>Amount Due</Text>
              <Text style={[styles.value, { fontSize: 14, fontWeight: 'bold', color: '#667eea' }]}>
                {formatCurrency(invoice.amountDue)}
              </Text>
            </View>
          </View>
        </View>

        {/* Line Items */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableColHeader, styles.descCol]}>Description</Text>
            <Text style={[styles.tableColHeader, styles.qtyCol]}>Qty</Text>
            <Text style={[styles.tableColHeader, styles.priceCol]}>Price</Text>
            <Text style={[styles.tableColHeader, styles.taxCol]}>GST %</Text>
            <Text style={[styles.tableColHeader, styles.totalCol]}>Total</Text>
          </View>
          {invoice.lineItems.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCol, styles.descCol]}>{item.description}</Text>
              <Text style={[styles.tableCol, styles.qtyCol]}>{item.quantity}</Text>
              <Text style={[styles.tableCol, styles.priceCol]}>
                {formatCurrency(item.unitPrice)}
              </Text>
              <Text style={[styles.tableCol, styles.taxCol]}>{item.taxPercent}%</Text>
              <Text style={[styles.tableCol, styles.totalCol]}>
                {formatCurrency(item.total)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>GST</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.taxTotal)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>

        {/* Bank Details */}
        {firstBankAccount && (
          <View style={styles.bankDetails}>
            <Text style={styles.bankTitle}>Payment Details</Text>
            <Text style={styles.bankText}>
              BSB: {firstBankAccount.bsb}
            </Text>
            <Text style={styles.bankText}>
              Account: {firstBankAccount.accountNumber}
            </Text>
            <Text style={styles.bankText}>
              Account Name: {firstBankAccount.accountName}
            </Text>
          </View>
        )}

        {/* Notes and Terms */}
        {(invoice.notes || invoice.terms) && (
          <View style={styles.footer}>
            {invoice.notes && (
              <View style={{ marginBottom: 15 }}>
                <Text style={styles.footerTitle}>Notes</Text>
                <Text style={styles.footerText}>{invoice.notes}</Text>
              </View>
            )}
            {invoice.terms && (
              <View>
                <Text style={styles.footerTitle}>Terms & Conditions</Text>
                <Text style={styles.footerText}>{invoice.terms}</Text>
              </View>
            )}
          </View>
        )}

        {/* Thank You */}
        <View style={{ marginTop: 30, textAlign: 'center' }}>
          <Text style={{ fontSize: 12, color: '#667eea', fontWeight: 'bold' }}>
            Thank you for your business!
          </Text>
        </View>
      </Page>
    </Document>
  );
};
