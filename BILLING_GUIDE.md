# Billing & Invoice Management Guide

This guide explains how to use the billing and invoice features of the Dental Clinic Management System, including the professional PDF invoice generation.

## Table of Contents

1. [Overview](#overview)
2. [Creating an Invoice](#creating-an-invoice)
3. [Viewing Invoice Details](#viewing-invoice-details)
4. [Downloading & Printing Invoices](#downloading--printing-invoices)
5. [Managing Payments](#managing-payments)
6. [Invoice Features](#invoice-features)

---

## Overview

The billing module provides comprehensive invoice management for your dental clinic:

- **Create invoices** linked to patient cases
- **Track payment status** (Paid, Pending, Overdue, Cancelled)
- **Generate professional PDF invoices** with clinic branding
- **Print invoices** directly from the browser
- **Monitor billing statistics** (Total Revenue, Paid, Pending, Overdue)
- **Search and filter** invoices by status, patient, or case

---

## Creating an Invoice

### From the Billing Page

1. Navigate to **Billing & Invoices** from the sidebar
2. Click the **"Create Invoice"** button in the top right
3. Fill in the invoice details:
   - Select patient
   - Select associated case
   - Enter invoice amount
   - Set due date
   - Choose initial status

4. Click **"Create Invoice"** to save

### From a Patient Case

Invoices can also be created directly from a patient's case page, automatically linking the invoice to that case.

---

## Viewing Invoice Details

### Accessing an Invoice

1. Go to **Billing & Invoices**
2. Find the invoice in the list
3. Click **"View"** button

### Invoice Detail Page

The invoice detail page displays:

**Header Section:**
- Invoice number and status badge
- Total amount (large, prominent display)

**Three-Column Layout:**

1. **Invoice Information**
   - Invoice number
   - Created date
   - Due date
   - Payment date (if paid)
   - Payment method (if paid)

2. **Patient Information**
   - Patient name with avatar
   - Email address
   - Phone number
   - Full address (if available)

3. **Treatment & Billing**
   - Treatment name and category
   - Diagnosis
   - Total case cost
   - Amount paid
   - Amount pending

**Invoice Items Table:**
- Detailed breakdown of treatment charges
- Itemized descriptions
- Individual and total amounts

**Related Links:**
- Quick access to view case details
- Quick access to view patient profile

---

## Downloading & Printing Invoices

### Download PDF

1. Open the invoice detail page
2. Click the **"Download PDF"** button
3. The PDF will be automatically downloaded to your device with the filename `Invoice_[Invoice-Number].pdf`

### Print Invoice

1. Open the invoice detail page
2. Click the **"Print"** button
3. The invoice will open in a new browser window with print preview
4. Use your browser's print dialog to print

### PDF Features

The generated PDF includes:

**Professional Header:**
- Clinic name and branding
- Clinic contact information
- Clinic address

**Invoice Details:**
- Invoice number
- Issue date and due date
- Status badge (color-coded)

**Patient Information:**
- Full name and contact details
- Complete mailing address

**Treatment Details:**
- Diagnosis
- Treatment name and category
- Detailed description

**Itemized Billing Table:**
- Professional table layout
- Clear item descriptions
- Amounts in Indian Rupees (₹)

**Financial Summary:**
- Subtotal
- Total amount (bold and prominent)
- Payment details (if paid)
- Payment method and date

**Case Summary:**
- Total case cost
- Amount already paid
- Outstanding balance

**Footer:**
- Professional thank you message
- Contact information for queries

---

## Managing Payments

### Mark Invoice as Paid

1. Open an invoice with **"Pending"** or **"Overdue"** status
2. Click the **"Mark as Paid"** button
3. In the payment modal:
   - Select payment method (Cash, Credit Card, UPI, etc.)
   - Choose payment date
   - Review the invoice amount
4. Click **"Mark as Paid"** to confirm

### What Happens When Marking as Paid

The system automatically:
- Updates invoice status to "Paid"
- Records payment date and method
- Updates the linked case's payment totals
- Updates case status to "Completed" if fully paid
- Shows success confirmation

### Payment Methods Supported

- Cash
- Credit Card
- Debit Card
- UPI
- Net Banking
- Cheque
- Bank Transfer

---

## Invoice Features

### Status Management

Invoices can have the following statuses:

| Status | Color | Description |
|--------|-------|-------------|
| **Paid** | Green | Payment received |
| **Pending** | Yellow | Awaiting payment |
| **Overdue** | Red | Past due date |
| **Cancelled** | Gray | Invoice cancelled |

### Search & Filter

On the billing page:

1. **Search**: Type patient name or invoice number
2. **Filter by Status**: Select status from dropdown
3. **Filter by Case**: Invoices can be filtered by case ID (from case page)

### Billing Statistics

Dashboard cards show:
- **Total Revenue**: Sum of all invoices
- **Paid**: Total amount received
- **Pending**: Awaiting payment
- **Overdue**: Past due invoices

### Invoice Numbering

Invoices are automatically assigned unique numbers in the format: `INV-YYYYMMDD-XXXX`

Example: `INV-20260128-0001`

---

## Customizing Invoice PDFs

### Updating Clinic Information

To customize the clinic details on PDF invoices:

1. Open `/src/lib/pdfGenerator.ts`
2. Find the "Clinic Details" section
3. Update the following:
   ```typescript
   doc.text('Your Clinic Name', 20, 25);
   doc.text('Your Address', 20, 32);
   doc.text('City, State ZIP', 20, 37);
   doc.text('Phone: Your Phone', 20, 42);
   doc.text('Email: Your Email', 20, 47);
   ```

### Customizing PDF Styling

Colors and styling can be modified in the same file:
- `primaryColor`: Main branding color (default: blue)
- `darkGray`: Text color
- `lightGray`: Secondary elements

---

## Best Practices

### Invoice Creation
- Create invoices promptly after treatment
- Set realistic due dates (typically 15-30 days)
- Link invoices to the correct patient and case

### Payment Processing
- Mark invoices as paid immediately upon receipt
- Record the correct payment method
- Use the actual payment date, not invoice date

### Invoice Management
- Regularly review overdue invoices
- Follow up on pending payments before due date
- Keep invoice numbering sequential and consistent

### PDF Generation
- Download PDFs for record-keeping
- Email PDFs to patients as receipts
- Print PDFs for patients who prefer paper invoices

---

## Troubleshooting

### PDF Download Not Working

If PDF download fails:
1. Check browser console for errors
2. Ensure jsPDF libraries are installed: `npm install jspdf jspdf-autotable`
3. Clear browser cache and try again

### Invoice Not Displaying

If an invoice doesn't show:
1. Verify the invoices table exists in Supabase
2. Check Row Level Security (RLS) policies
3. Ensure the invoice ID is correct

### Payment Update Failed

If marking as paid fails:
1. Check Supabase connection
2. Verify user has permission to update invoices
3. Ensure case still exists and is linked properly

---

## Technical Details

### Database Schema

The invoices table includes:
- `id` (UUID, Primary Key)
- `invoice_number` (Text, Unique)
- `patient_id` (UUID, Foreign Key → patients)
- `case_id` (UUID, Foreign Key → cases)
- `amount` (Numeric)
- `status` (Text)
- `due_date` (Date)
- `payment_date` (Date, nullable)
- `payment_method` (Text, nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Dependencies

- **jsPDF**: PDF generation library
- **jspdf-autotable**: Table formatting for PDFs
- **Lucide React**: Icons for UI
- **Supabase**: Backend and database

---

## Future Enhancements

Planned features for future releases:
- Email invoice delivery
- Automated payment reminders
- Recurring invoices for ongoing treatments
- Multi-currency support
- Tax calculations
- Discount management
- Partial payment tracking
- Invoice templates
- Batch invoice generation

---

## Support

For issues or questions:
1. Check this documentation
2. Review the [Setup Guide](./SETUP.md)
3. Check [Authentication Setup](./AUTH_SETUP.md)
4. Review Supabase console for data issues

---

*Last Updated: January 28, 2026*
