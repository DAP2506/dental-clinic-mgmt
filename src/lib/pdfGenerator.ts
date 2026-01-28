import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './supabase';

interface ClinicSettings {
  clinic_name: string;
  clinic_email: string | null;
  clinic_phone: string | null;
  clinic_address: string | null;
  clinic_city: string | null;
  clinic_state: string | null;
  clinic_postal_code: string | null;
  clinic_country: string;
}

interface InvoiceData {
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string;
  payment_date?: string;
  payment_method?: string;
  created_at: string;
  patients: {
    first_name: string;
    last_name: string;
    email: string;
    patient_phone: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  };
  cases: {
    final_diagnosis: string;
    total_cost: number;
    amount_paid: number;
    amount_pending: number;
    treatments?: {
      name: string;
      description?: string;
      category?: string;
    };
  };
}

// Fetch clinic settings from database
async function getClinicSettings(): Promise<ClinicSettings> {
  try {
    const { data, error } = await supabase
      .from('clinic_settings')
      .select('*')
      .single();

    if (error || !data) {
      // Return default settings if none found
      return {
        clinic_name: 'Dental Clinic',
        clinic_email: 'info@dentalclinic.com',
        clinic_phone: '(555) 123-4567',
        clinic_address: '123 Medical Street',
        clinic_city: 'City',
        clinic_state: 'State',
        clinic_postal_code: '12345',
        clinic_country: 'India'
      };
    }

    return data;
  } catch (error) {
    console.error('Error fetching clinic settings:', error);
    // Return default settings on error
    return {
      clinic_name: 'Dental Clinic',
      clinic_email: 'info@dentalclinic.com',
      clinic_phone: '(555) 123-4567',
      clinic_address: '123 Medical Street',
      clinic_city: 'City',
      clinic_state: 'State',
      clinic_postal_code: '12345',
      clinic_country: 'India'
    };
  }
}

export const generateInvoicePDF = async (invoice: InvoiceData) => {
  // Fetch clinic settings
  const clinicSettings = await getClinicSettings();
  
  const doc = new jsPDF();
  
  // Colors
  const primaryColor: [number, number, number] = [37, 99, 235]; // Blue
  const darkGray: [number, number, number] = [55, 65, 81];
  const lightGray: [number, number, number] = [156, 163, 175];
  
  // Header - Clinic Name
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(clinicSettings.clinic_name, 20, 25);
  
  // Clinic Details - with better spacing to avoid overlap
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.setFont('helvetica', 'normal');
  
  let yPosition = 32;
  
  // Address line
  if (clinicSettings.clinic_address) {
    doc.text(clinicSettings.clinic_address, 20, yPosition);
    yPosition += 4;
  }
  
  // City, State, Postal Code line
  if (clinicSettings.clinic_city || clinicSettings.clinic_state) {
    const cityStateLine = [
      clinicSettings.clinic_city,
      clinicSettings.clinic_state,
      clinicSettings.clinic_postal_code
    ].filter(Boolean).join(', ');
    
    if (cityStateLine) {
      doc.text(cityStateLine, 20, yPosition);
      yPosition += 4;
    }
  }
  
  // Phone line
  if (clinicSettings.clinic_phone) {
    doc.text(`Phone: ${clinicSettings.clinic_phone}`, 20, yPosition);
    yPosition += 4;
  }
  
  // Email line
  if (clinicSettings.clinic_email) {
    doc.text(`Email: ${clinicSettings.clinic_email}`, 20, yPosition);
    yPosition += 4;
  }
  
  // Calculate separator position (add some padding)
  const separatorY = Math.max(yPosition + 3, 55);
  
  // Invoice Title
  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 150, 25);
  
  // Invoice Number and Status
  doc.setFontSize(10);
  doc.setTextColor(...darkGray);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoice_number}`, 150, 32);
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 150, 37);
  doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 150, 42);
  
  // Status Badge
  doc.setFont('helvetica', 'bold');
  if (invoice.status === 'Paid') {
    doc.setTextColor(22, 163, 74); // Green
  } else if (invoice.status === 'Overdue') {
    doc.setTextColor(239, 68, 68); // Red
  } else {
    doc.setTextColor(234, 179, 8); // Yellow
  }
  doc.text(`Status: ${invoice.status}`, 150, 47);
  
  // Reset color
  doc.setTextColor(...darkGray);
  doc.setFont('helvetica', 'normal');
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.setDrawColor(...lightGray);
  doc.line(20, separatorY, 190, separatorY);
  
  // Bill To Section
  const billToY = separatorY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, billToY);
  
  let patientY = billToY + 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoice.patients.first_name} ${invoice.patients.last_name}`, 20, patientY);
  patientY += 5;
  doc.text(invoice.patients.email, 20, patientY);
  patientY += 5;
  doc.text(invoice.patients.patient_phone, 20, patientY);
  patientY += 5;
  
  if (invoice.patients.address) {
    doc.text(invoice.patients.address, 20, patientY);
    patientY += 5;
    if (invoice.patients.city && invoice.patients.state) {
      doc.text(`${invoice.patients.city}, ${invoice.patients.state} ${invoice.patients.postal_code || ''}`, 20, patientY);
      patientY += 5;
    }
  }
  
  // Treatment Details Section
  const startY = patientY + 8;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Treatment Details:', 20, startY);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Diagnosis: ${invoice.cases.final_diagnosis || 'N/A'}`, 20, startY + 7);
  if (invoice.cases.treatments?.name) {
    doc.text(`Treatment: ${invoice.cases.treatments.name}`, 20, startY + 12);
    if (invoice.cases.treatments.category) {
      doc.text(`Category: ${invoice.cases.treatments.category}`, 20, startY + 17);
    }
  }
  
  // Invoice Items Table
  const tableStartY = startY + 25;
  
  autoTable(doc, {
    startY: tableStartY,
    head: [['Description', 'Amount']],
    body: [
      [
        invoice.cases.treatments?.name || 'Dental Treatment',
        `₹${invoice.amount.toFixed(2)}`
      ],
      ...(invoice.cases.treatments?.description ? [[
        invoice.cases.treatments.description,
        ''
      ]] : [])
    ],
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 40, halign: 'right' }
    },
    margin: { left: 20, right: 20 },
    styles: {
      fontSize: 10
    },
    bodyStyles: {
      textColor: darkGray
    }
  });
  
  // Summary Section
  const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 40;
  const summaryX = 130;
  
  // Summary box background
  doc.setFillColor(249, 250, 251); // Light gray background
  doc.rect(summaryX - 5, finalY + 5, 65, 35, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Subtotal
  doc.text('Subtotal:', summaryX, finalY + 15);
  doc.text(`₹${invoice.amount.toFixed(2)}`, 185, finalY + 15, { align: 'right' });
  
  // Total (bold and larger)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', summaryX, finalY + 25);
  doc.text(`₹${invoice.amount.toFixed(2)}`, 185, finalY + 25, { align: 'right' });
  
  // Amount Paid (if applicable)
  if (invoice.status === 'Paid' && invoice.payment_date) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(22, 163, 74); // Green
    doc.text('Amount Paid:', summaryX, finalY + 35);
    doc.text(`₹${invoice.amount.toFixed(2)}`, 185, finalY + 35, { align: 'right' });
    
    // Payment details
    doc.setTextColor(...darkGray);
    doc.text(`Paid on: ${new Date(invoice.payment_date).toLocaleDateString()}`, 20, finalY + 50);
    if (invoice.payment_method) {
      doc.text(`Payment Method: ${invoice.payment_method}`, 20, finalY + 55);
    }
  }
  
  // Case Summary
  const caseInfoY = finalY + 70;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('Case Summary:', 20, caseInfoY);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Case Cost: ₹${invoice.cases.total_cost.toFixed(2)}`, 20, caseInfoY + 7);
  doc.text(`Amount Paid: ₹${invoice.cases.amount_paid.toFixed(2)}`, 20, caseInfoY + 12);
  doc.setTextColor(234, 88, 12); // Orange
  doc.text(`Amount Pending: ₹${invoice.cases.amount_pending.toFixed(2)}`, 20, caseInfoY + 17);
  
  // Footer
  doc.setTextColor(...lightGray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for choosing our dental clinic!', 105, 280, { align: 'center' });
  doc.text('For any queries, please contact us at the above details.', 105, 285, { align: 'center' });
  
  // Save the PDF
  doc.save(`Invoice_${invoice.invoice_number}.pdf`);
};

// Function to generate and print invoice
export const printInvoice = async (invoice: InvoiceData) => {
  // Generate the PDF (reuse the same logic)
  const clinicSettings = await getClinicSettings();
  
  const doc = new jsPDF();
  
  // Colors
  const primaryColor: [number, number, number] = [37, 99, 235];
  const darkGray: [number, number, number] = [55, 65, 81];
  const lightGray: [number, number, number] = [156, 163, 175];
  
  // Header - Clinic Name
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(clinicSettings.clinic_name, 20, 25);
  
  // Clinic Details - with better spacing
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.setFont('helvetica', 'normal');
  
  let yPosition = 32;
  if (clinicSettings.clinic_address) {
    doc.text(clinicSettings.clinic_address, 20, yPosition);
    yPosition += 4;
  }
  if (clinicSettings.clinic_city || clinicSettings.clinic_state) {
    const cityStateLine = [
      clinicSettings.clinic_city,
      clinicSettings.clinic_state,
      clinicSettings.clinic_postal_code
    ].filter(Boolean).join(', ');
    if (cityStateLine) {
      doc.text(cityStateLine, 20, yPosition);
      yPosition += 4;
    }
  }
  if (clinicSettings.clinic_phone) {
    doc.text(`Phone: ${clinicSettings.clinic_phone}`, 20, yPosition);
    yPosition += 4;
  }
  if (clinicSettings.clinic_email) {
    doc.text(`Email: ${clinicSettings.clinic_email}`, 20, yPosition);
    yPosition += 4;
  }
  
  // Calculate separator position
  const separatorY = Math.max(yPosition + 3, 55);
  
  // Invoice Title and details on the right
  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 150, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(...darkGray);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoice_number}`, 150, 32);
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 150, 37);
  doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 150, 42);
  
  doc.setFont('helvetica', 'bold');
  if (invoice.status === 'Paid') {
    doc.setTextColor(22, 163, 74);
  } else if (invoice.status === 'Overdue') {
    doc.setTextColor(239, 68, 68);
  } else {
    doc.setTextColor(234, 179, 8);
  }
  doc.text(`Status: ${invoice.status}`, 150, 47);
  
  doc.setTextColor(...darkGray);
  doc.setFont('helvetica', 'normal');
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.setDrawColor(...lightGray);
  doc.line(20, separatorY, 190, separatorY);
  
  // Bill To Section
  const billToY = separatorY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, billToY);
  
  let patientY = billToY + 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoice.patients.first_name} ${invoice.patients.last_name}`, 20, patientY);
  patientY += 5;
  doc.text(invoice.patients.email, 20, patientY);
  patientY += 5;
  doc.text(invoice.patients.patient_phone, 20, patientY);
  patientY += 5;
  
  if (invoice.patients.address) {
    doc.text(invoice.patients.address, 20, patientY);
    patientY += 5;
    if (invoice.patients.city && invoice.patients.state) {
      doc.text(`${invoice.patients.city}, ${invoice.patients.state} ${invoice.patients.postal_code || ''}`, 20, patientY);
      patientY += 5;
    }
  }
  
  // Treatment Details
  const startY = patientY + 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Treatment Details:', 20, startY);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Diagnosis: ${invoice.cases.final_diagnosis || 'N/A'}`, 20, startY + 7);
  if (invoice.cases.treatments?.name) {
    doc.text(`Treatment: ${invoice.cases.treatments.name}`, 20, startY + 12);
  }
  
  // Invoice Items Table
  const tableStartY = startY + 20;
  autoTable(doc, {
    startY: tableStartY,
    head: [['Description', 'Amount']],
    body: [[
      invoice.cases.treatments?.name || 'Dental Treatment',
      `₹${invoice.amount.toFixed(2)}`
    ]],
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 40, halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  });
  
  const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 30;
  
  // Summary
  const summaryX = 130;
  doc.setFillColor(249, 250, 251);
  doc.rect(summaryX - 5, finalY + 5, 65, 25, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', summaryX, finalY + 15);
  doc.text(`₹${invoice.amount.toFixed(2)}`, 185, finalY + 15, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', summaryX, finalY + 25);
  doc.text(`₹${invoice.amount.toFixed(2)}`, 185, finalY + 25, { align: 'right' });
  
  // Footer
  doc.setTextColor(...lightGray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for choosing our dental clinic!', 105, 280, { align: 'center' });
  
  // For printing, open in a new window instead of downloading
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};
