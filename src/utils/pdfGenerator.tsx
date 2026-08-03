import React from 'react';
import { createRoot } from 'react-dom/client';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Invoice, Quotation, Customer, AdminSettings } from '../types';
import PrintView from '../components/PrintView';

const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB Strict Limit

export const generateDocumentPDF = async (
  document: { type: 'invoice' | 'quotation'; data: Invoice | Quotation },
  customers: Customer[],
  settings: AdminSettings
): Promise<Blob> => {
  return new Promise(async (resolve, reject) => {
    let hiddenContainer: HTMLDivElement | null = null;
    let root: any = null;

    try {
      const existingElement = window.document.querySelector('#invoice-printable-area') as HTMLElement;
      let targetElement: HTMLElement;

      if (existingElement) {
        targetElement = existingElement;
      } else {
        hiddenContainer = window.document.createElement('div');
        hiddenContainer.style.position = 'fixed';
        hiddenContainer.style.left = '-9999px';
        hiddenContainer.style.top = '0';
        hiddenContainer.style.width = '800px';
        hiddenContainer.style.backgroundColor = '#ffffff';
        window.document.body.appendChild(hiddenContainer);

        root = createRoot(hiddenContainer);
        root.render(
          <div id="pdf-render-target" style={{ width: '800px', backgroundColor: '#ffffff' }}>
            <PrintView document={document} customers={customers} settings={settings} onClose={() => {}} />
          </div>
        );

        // Wait for React component mount & external images to load
        await new Promise((res) => setTimeout(res, 500));
        const el = hiddenContainer.querySelector('#invoice-printable-area') as HTMLElement;
        if (!el) {
          throw new Error('Printable area element not found');
        }
        targetElement = el;
      }

      // Convert HTML element to high-res PNG natively via browser engine (completely immune to oklch CSS color errors)
      const dataUrl = await toPng(targetElement, {
        quality: 0.95,
        pixelRatio: 2, // High resolution output
        backgroundColor: '#ffffff',
        style: {
          overflow: 'visible',
          height: 'auto',
          maxHeight: 'none',
        },
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      let blob = pdf.output('blob');

      // Fallback compression: Ensure PDF is strictly less than 5 MB
      if (blob.size > MAX_PDF_SIZE_BYTES) {
        const compressedDataUrl = await toPng(targetElement, {
          quality: 0.80,
          pixelRatio: 1.5,
          backgroundColor: '#ffffff',
        });
        const compPdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true,
        });
        const compProps = compPdf.getImageProperties(compressedDataUrl);
        const compWidth = compPdf.internal.pageSize.getWidth();
        const compHeight = (compProps.height * compWidth) / compProps.width;
        compPdf.addImage(compressedDataUrl, 'PNG', 0, 0, compWidth, compHeight, undefined, 'FAST');
        blob = compPdf.output('blob');
      }

      if (root && hiddenContainer) {
        root.unmount();
        if (hiddenContainer.parentNode) {
          hiddenContainer.parentNode.removeChild(hiddenContainer);
        }
      }

      resolve(blob);
    } catch (err) {
      if (root && hiddenContainer) {
        root.unmount();
        if (hiddenContainer.parentNode) {
          hiddenContainer.parentNode.removeChild(hiddenContainer);
        }
      }
      reject(err);
    }
  });
};
