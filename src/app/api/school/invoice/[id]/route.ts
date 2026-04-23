import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invoices, schools, schoolAdmins } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: invoiceId } = await params;

        // CRITICAL FIX #2: Auth-first approach to prevent enumeration attacks
        // 1. Verify session and role BEFORE any data fetch
        const session = await verifySession();
        if (!session || session.userType !== 'school_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch school admin to get school_id (single query)
        const admin = await db.query.schoolAdmins.findFirst({
            where: and(
                eq(schoolAdmins.id, session.userId),
                eq(schoolAdmins.is_active, true),
                isNull(schoolAdmins.deleted_at)
            ),
            columns: { school_id: true }
        });

        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 3. Fetch invoice with SCHOOL_ID FILTER (prevent cross-school access)
        // This ensures we only fetch invoices belonging to the admin's school
        const invoice = await db.query.invoices.findFirst({
            where: and(
                eq(invoices.id, invoiceId),
                eq(invoices.school_id, admin.school_id) // CRITICAL: Enforce school isolation
            ),
            with: {
                transaction: true,
                subscription: {
                    with: {
                        plan: true
                    }
                }
            }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // 4. Fetch school details for the header
        const school = await db.query.schools.findFirst({
            where: eq(schools.id, invoice.school_id)
        });

        // 4. Generate a simple HTML/Printer-friendly response or structured data
        // For a true "download", we could generate a PDF, but for now we provide
        // a clean HTML print view which the browser can "Save as PDF"
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice - ${invoice.invoice_number}</title>
                <style>
                    body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
                    .invoice-box { max-width: 800px; margin: auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
                    .logo { font-size: 24px; font-weight: 900; color: #4f46e5; }
                    .invoice-info { text-align: right; }
                    .invoice-info h1 { margin: 0; font-size: 32px; font-weight: 900; color: #0f172a; }
                    .details { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                    .details h4 { margin: 0 0 10px 0; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; }
                    .table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                    .table th { text-align: left; padding: 15px; border-bottom: 2px solid #f1f5f9; font-size: 12px; font-weight: 900; text-transform: uppercase; color: #64748b; }
                    .table td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 500; }
                    .totals { text-align: right; }
                    .total-row { display: flex; justify-content: flex-end; gap: 20px; font-size: 16px; margin-bottom: 10px; }
                    .grand-total { font-size: 24px; font-weight: 900; color: #4f46e5; margin-top: 10px; border-top: 2px solid #f1f5f9; padding-top: 10px; }
                    .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #94a3b8; border-top: 1px dashed #e2e8f0; pt: 20px; }
                    @media print {
                        .no-print { display: none; }
                        body { padding: 0; }
                        .invoice-box { border: none; box-shadow: none; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="max-width: 800px; margin: 0 auto 20px; text-align: right;">
                    <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">Print / Download PDF</button>
                </div>
                <div class="invoice-box">
            {/* Metadata (Hidden for print) */}
            <div id="invoice-metadata" style="display: none;" aria-hidden="true">
                Invoice Number: ${invoice.invoice_number}
                Issue Date: ${invoice.issued_at ? new Date(invoice.issued_at).toISOString() : 'N/A'}
            </div>

            <div class="header">
                <div class="logo">TECH NURTURE LABS</div>
                <div class="invoice-info">
                    <h1>INVOICE</h1>
                    <p style="margin: 5px 0; font-weight: 700;">#${invoice.invoice_number}</p>
                    <p style="margin: 0; color: #64748b;">Issued: ${invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : 'N/A'}</p>
                </div>
            </div>

                    <div class="details">
                        <div>
                            <h4>Billed From</h4>
                            <p style="margin: 0; font-weight: 700;">TechNurture Labs Pvt Ltd</p>
                            <p style="margin: 5px 0; color: #64748b;">GSTIN: 01ABCDE1234F1Z5</p>
                            <p style="margin: 0; color: #64748b;">Bangalore, Karnataka, India</p>
                        </div>
                        <div>
                            <h4>Billed To</h4>
                            <p style="margin: 0; font-weight: 700;">${school?.name || invoice.billing_name}</p>
                            <p style="margin: 5px 0; color: #64748b;">${invoice.billing_address}</p>
                        </div>
                    </div>

                    <table class="table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Billing Cycle</th>
                                <th style="text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <strong>${(invoice as any).subscription?.plan?.name || 'Academic License'} Plan Upgrade</strong><br>
                                    <span style="font-size: 12px; color: #64748b;">Full platform access for 1 year</span>
                                </td>
                                <td>Annual</td>
                                <td style="text-align: right; font-weight: 700;">${invoice.currency} ${invoice.subtotal}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="totals">
                        <div class="total-row">
                            <span style="color: #64748b;">Subtotal:</span>
                            <span style="font-weight: 700;">${invoice.currency} ${invoice.subtotal}</span>
                        </div>
                        <div class="total-row">
                            <span style="color: #64748b;">Tax (0%):</span>
                            <span style="font-weight: 700;">${invoice.currency} 0.00</span>
                        </div>
                        <div class="total-row grand-total">
                            <span>TOTAL PAID:</span>
                            <span>${invoice.currency} ${invoice.total}</span>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Thank you for choosing TechNurture Labs to empower your institution.</p>
                        <p>This is a computer generated invoice and does not require a physical signature.</p>
                        <p>&copy; ${new Date().getFullYear()} TechNurture Labs. All rights reserved.</p>
                        <p style="margin-top:6px;font-size:11px;color:#94a3b8;">Developed by <a href="https://easyio.tech/" style="color:#3b82f6;text-decoration:none;">Easyio Technologies</a></p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `inline; filename="invoice-${invoice.invoice_number}.pdf"`,
            },
        });

    } catch (error: any) {
        logger.error('[Invoice Download] Failure', { message: error.message });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
