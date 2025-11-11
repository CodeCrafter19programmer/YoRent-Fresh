import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Printer, Edit2, Save } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  tenant: {
    full_name: string;
    email: string;
    phone: string;
    property: { name: string; address: string };
    monthly_rent: number;
  };
  payment: {
    amount: number;
    paid_date: string;
    month: string;
  };
}

export const InvoiceModal = ({ open, onClose, tenant, payment }: InvoiceModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `INV-${Date.now()}`,
    date: new Date().toLocaleDateString(),
    tenantName: tenant.full_name,
    tenantEmail: tenant.email,
    tenantPhone: tenant.phone || 'N/A',
    propertyName: tenant.property?.name || 'N/A',
    propertyAddress: tenant.property?.address || 'N/A',
    monthlyRent: tenant.monthly_rent,
    amountPaid: payment.amount,
    paymentDate: payment.paid_date || new Date().toISOString().split('T')[0],
    paymentPeriod: payment.month,
    nextDueDate: calculateNextDueDate(payment.paid_date || new Date().toISOString().split('T')[0]),
    outstanding: tenant.monthly_rent - payment.amount,
    notes: 'Thank you for your payment.',
  });

  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `Invoice-${invoiceData.invoiceNumber}`,
  });

  function calculateNextDueDate(paidDate: string): string {
    const date = new Date(paidDate);
    date.setMonth(date.getMonth() + 1);
    return date.toLocaleDateString();
  }

  const handleChange = (field: string, value: string | number) => {
    setInvoiceData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice / Receipt</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
                {isEditing ? 'Done' : 'Edit'}
              </Button>
              <Button size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Invoice Content */}
        <div ref={invoiceRef} className="bg-white p-8 space-y-6">
          {/* Header */}
          <div className="border-b-2 border-primary pb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-primary">YoRent</h1>
                <p className="text-sm text-gray-600 mt-1">Property Management</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-800">INVOICE</h2>
                {isEditing ? (
                  <Input
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                    className="mt-2 w-48"
                  />
                ) : (
                  <p className="text-sm text-gray-600 mt-2">{invoiceData.invoiceNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Dates and Property */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-xs text-gray-500">Invoice Date</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={invoiceData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 font-medium">{invoiceData.date}</p>
              )}
            </div>
            <div>
              <Label className="text-xs text-gray-500">Payment Period</Label>
              {isEditing ? (
                <Input
                  value={invoiceData.paymentPeriod}
                  onChange={(e) => handleChange('paymentPeriod', e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 font-medium">{invoiceData.paymentPeriod}</p>
              )}
            </div>
          </div>

          {/* Tenant and Property Details */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Tenant Name</Label>
                {isEditing ? (
                  <Input
                    value={invoiceData.tenantName}
                    onChange={(e) => handleChange('tenantName', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 font-medium">{invoiceData.tenantName}</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-gray-500">Email</Label>
                {isEditing ? (
                  <Input
                    value={invoiceData.tenantEmail}
                    onChange={(e) => handleChange('tenantEmail', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">{invoiceData.tenantEmail}</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-gray-500">Phone</Label>
                {isEditing ? (
                  <Input
                    value={invoiceData.tenantPhone}
                    onChange={(e) => handleChange('tenantPhone', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">{invoiceData.tenantPhone}</p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Property</Label>
                {isEditing ? (
                  <Input
                    value={invoiceData.propertyName}
                    onChange={(e) => handleChange('propertyName', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 font-medium">{invoiceData.propertyName}</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-gray-500">Address</Label>
                {isEditing ? (
                  <Textarea
                    value={invoiceData.propertyAddress}
                    onChange={(e) => handleChange('propertyAddress', e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                ) : (
                  <p className="mt-1 text-sm">{invoiceData.propertyAddress}</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-t pt-6">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 text-sm font-semibold">Description</th>
                  <th className="text-right p-3 text-sm font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3">Monthly Rent</td>
                  <td className="text-right p-3">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={invoiceData.monthlyRent}
                        onChange={(e) => handleChange('monthlyRent', parseFloat(e.target.value))}
                        className="w-32 ml-auto"
                      />
                    ) : (
                      `$${invoiceData.monthlyRent.toFixed(2)}`
                    )}
                  </td>
                </tr>
                <tr className="border-b bg-green-50">
                  <td className="p-3 font-medium">Amount Paid</td>
                  <td className="text-right p-3 font-medium text-green-600">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={invoiceData.amountPaid}
                        onChange={(e) => handleChange('amountPaid', parseFloat(e.target.value))}
                        className="w-32 ml-auto"
                      />
                    ) : (
                      `$${invoiceData.amountPaid.toFixed(2)}`
                    )}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Outstanding Balance</td>
                  <td className="text-right p-3 font-bold text-red-600">
                    ${(invoiceData.monthlyRent - invoiceData.amountPaid).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Next Payment Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <Label className="text-xs text-blue-700">Next Payment Due</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={invoiceData.nextDueDate}
                    onChange={(e) => handleChange('nextDueDate', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 font-bold text-blue-900">{invoiceData.nextDueDate}</p>
                )}
              </div>
              <div className="text-right">
                <Label className="text-xs text-blue-700">Amount Due</Label>
                <p className="mt-1 font-bold text-blue-900">
                  ${invoiceData.monthlyRent.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs text-gray-500">Notes</Label>
            {isEditing ? (
              <Textarea
                value={invoiceData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="mt-1"
                rows={3}
              />
            ) : (
              <p className="mt-1 text-sm text-gray-600">{invoiceData.notes}</p>
            )}
          </div>

          {/* Footer */}
          <div className="border-t pt-6 text-center text-xs text-gray-500">
            <p>This is an official receipt for your payment. Keep this for your records.</p>
            <p className="mt-1">Generated on {new Date().toLocaleString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
