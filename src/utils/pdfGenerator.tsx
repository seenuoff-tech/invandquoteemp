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
          element.style.backgroundColor = 'white';
          element.style.color = '#000';

          const canvas = await html2canvas(element, {
            scale: 2, // Higher quality
            useCORS: true, // Crucial for external logos
            backgroundColor: '#ffffff',
            windowWidth: 800,
            onclone: (clonedDoc) => {
              // Strip or override oklch CSS variables and properties in cloned document
              const styleEls = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
              styleEls.forEach((s) => {
                try {
                  if (s.tagName === 'STYLE') {
                    s.innerHTML = s.innerHTML.replace(/oklch\([^)]+\)/g, '#1e293b');
                  }
                } catch (e) {}
              });

              const el = clonedDoc.querySelector('#invoice-printable-area') as HTMLElement;
              if (el) {
                const allElements = el.querySelectorAll('*');
                allElements.forEach((child) => {
                  const htmlChild = child as HTMLElement;
                  // Explicitly set explicit hex colors on key template elements to prevent oklch parsing errors
                  if (htmlChild.classList.contains('bg-blue-900')) {
                    htmlChild.style.backgroundColor = '#1e3a8a';
                  }
                  if (htmlChild.classList.contains('bg-slate-50') || htmlChild.classList.contains('bg-slate-50/70')) {
                    htmlChild.style.backgroundColor = '#f8fafc';
                  }
                  if (htmlChild.classList.contains('text-blue-900')) {
                    htmlChild.style.color = '#1e3a8a';
                  }
                  if (htmlChild.classList.contains('text-slate-900')) {
                    htmlChild.style.color = '#0f172a';
                  }
                  if (htmlChild.classList.contains('text-slate-700')) {
                    htmlChild.style.color = '#334155';
                  }
                  if (htmlChild.classList.contains('text-slate-500')) {
                    htmlChild.style.color = '#64748b';
                  }
                  if (htmlChild.classList.contains('text-emerald-700')) {
                    htmlChild.style.color = '#047857';
                  }
                  if (htmlChild.classList.contains('text-rose-700')) {
                    htmlChild.style.color = '#be123c';
                  }
                  if (htmlChild.classList.contains('border-slate-200') || htmlChild.classList.contains('border-slate-100')) {
                    htmlChild.style.borderColor = '#e2e8f0';
                  }
                });
              }
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
          const pageHeight = pdf.internal.pageSize.getHeight();

          let heightLeft = pdfHeight;
          let position = 0;

          // Add first page
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;

          // Add extra pages if content overflows A4 height
          while (heightLeft > 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;
          }
          
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
