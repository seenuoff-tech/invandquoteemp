import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Invoice, Quotation, Customer, AdminSettings } from '../types';
import PrintView from '../components/PrintView';

export const generateDocumentPDF = async (
  document: { type: 'invoice' | 'quotation'; data: Invoice | Quotation },
  customers: Customer[],
  settings: AdminSettings
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const hiddenContainer = window.document.createElement('div');
      hiddenContainer.style.position = 'absolute';
      hiddenContainer.style.left = '-9999px';
      hiddenContainer.style.top = '0';
      hiddenContainer.style.width = '1024px';
      hiddenContainer.style.backgroundColor = 'white';
      
      // Need to attach to body for Tailwind styles to apply
      window.document.body.appendChild(hiddenContainer);

      const root = createRoot(hiddenContainer);
      
      // Render the PrintView inside our hidden container
      root.render(
        <div id="pdf-render-target">
          <PrintView 
            document={document}
            customers={customers}
            settings={settings}
            onClose={() => {}}
          />
        </div>
      );

      // Wait a moment for rendering and images to load
      setTimeout(async () => {
        try {
          const element = hiddenContainer.querySelector('#invoice-printable-area') as HTMLElement;
          if (!element) throw new Error('Printable area not found');

          // Ensure it's visible to html2canvas and styled properly for PDF
          element.style.width = '800px'; 
          element.style.margin = '0';
          element.style.padding = '40px';
          element.style.backgroundColor = '#ffffff';
          element.style.color = '#000000';

          const canvas = await html2canvas(element, {
            scale: 2, // Higher quality
            useCORS: true, // Crucial for external logos
            backgroundColor: '#ffffff',
            windowWidth: 800,
            onclone: (clonedDoc) => {
              // Convert oklch & oklab colors to safe hex fallback across all stylesheets
              const styleEls = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
              styleEls.forEach((s) => {
                try {
                  if (s.tagName === 'STYLE') {
                    s.innerHTML = s.innerHTML
                      .replace(/oklch\([^)]+\)/gi, '#1e293b')
                      .replace(/oklab\([^)]+\)/gi, '#1e293b');
                  }
                } catch (e) {}
              });
            }
          });

          const imgData = canvas.toDataURL('image/png');
          
          // Calculate PDF dimensions (A4 size is 210x297 mm)
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          
          const blob = pdf.output('blob');
          
          // Cleanup
          root.unmount();
          window.document.body.removeChild(hiddenContainer);
          
          resolve(blob);
        } catch (error) {
          root.unmount();
          window.document.body.removeChild(hiddenContainer);
          reject(error);
        }
      }, 1000); // 1000ms delay to allow external images to load
    } catch (error) {
      reject(error);
    }
  });
};
