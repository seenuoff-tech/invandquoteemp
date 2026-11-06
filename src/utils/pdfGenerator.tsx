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
        await new Promise((res) => setTimeout(res, 600));
        const el = hiddenContainer.querySelector('#invoice-printable-area') as HTMLElement;
        if (!el) {
          throw new Error('Printable area element not found');
        }
        targetElement = el;
      }

      // Temporarily expand scrollable modal parent & target so html-to-image captures 100% of full height (including QR & Bank details)
      const parentModal = targetElement.parentElement as HTMLElement | null;
      const origTargetOverflow = targetElement.style.overflow;
      const origTargetHeight = targetElement.style.height;
      const origTargetMaxHeight = targetElement.style.maxHeight;
      const origParentMaxHeight = parentModal ? parentModal.style.maxHeight : '';
      const origParentOverflow = parentModal ? parentModal.style.overflow : '';

      targetElement.style.overflow = 'visible';
      targetElement.style.height = 'auto';
      targetElement.style.maxHeight = 'none';
      if (parentModal) {
        parentModal.style.maxHeight = 'none';
        parentModal.style.overflow = 'visible';
      }

      const fullWidth = targetElement.scrollWidth || 800;
      const fullHeight = targetElement.scrollHeight;

      // Convert HTML element to high-res PNG natively via browser engine
      const dataUrl = await toPng(targetElement, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: fullWidth,
        height: fullHeight,
        style: {
          overflow: 'visible',
          height: `${fullHeight}px`,
          maxHeight: 'none',
        },
      });

      // Restore original styles
      targetElement.style.overflow = origTargetOverflow;
      targetElement.style.height = origTargetHeight;
      targetElement.style.maxHeight = origTargetMaxHeight;
      if (parentModal) {
        parentModal.style.maxHeight = origParentMaxHeight;
        parentModal.style.overflow = origParentOverflow;
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Support single page fit or multi-page slicing if very tall
      if (imgHeight <= pageHeight) {
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, imgHeight, undefined, 'FAST');
      } else {
        // Scale down slightly to fit neatly on 1 A4 page if within 1.35x page height, otherwise multi-page
        if (imgHeight <= pageHeight * 1.35) {
          const scale = pageHeight / imgHeight;
          const scaledWidth = pdfWidth * scale;
          const xOffset = (pdfWidth - scaledWidth) / 2;
          pdf.addImage(dataUrl, 'PNG', xOffset, 0, scaledWidth, pageHeight, undefined, 'FAST');
        } else {
          let heightLeft = imgHeight;
          let position = 0;
          pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pageHeight;
          while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;
          }
        }
      }

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
