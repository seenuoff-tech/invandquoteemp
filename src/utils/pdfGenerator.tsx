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
        // Target the inner A4 content wrapper (which is never clipped by flex-1 overflow-y-auto)
        targetElement = (existingElement.firstElementChild as HTMLElement) || existingElement;
      } else {
        hiddenContainer = window.document.createElement('div');
        hiddenContainer.style.position = 'fixed';
        hiddenContainer.style.left = '-9999px';
        hiddenContainer.style.top = '0';
        hiddenContainer.style.width = '820px';
        hiddenContainer.style.backgroundColor = '#ffffff';
        window.document.body.appendChild(hiddenContainer);

        root = createRoot(hiddenContainer);
        root.render(
          <div id="pdf-render-target" style={{ width: '820px', backgroundColor: '#ffffff' }}>
            <PrintView document={document} customers={customers} settings={settings} onClose={() => {}} />
          </div>
        );

        // Wait for React component mount & external images to load
        await new Promise((res) => setTimeout(res, 700));
        const el = hiddenContainer.querySelector('#invoice-printable-area') as HTMLElement;
        if (!el) {
          throw new Error('Printable area element not found');
        }
        targetElement = (el.firstElementChild as HTMLElement) || el;
      }

      // Clone the full unclipped invoice content into a clean off-screen wrapper with zero height/overflow constraints
      const offscreenWrapper = window.document.createElement('div');
      offscreenWrapper.style.position = 'fixed';
      offscreenWrapper.style.left = '0';
      offscreenWrapper.style.top = '0';
      offscreenWrapper.style.zIndex = '-9999';
      offscreenWrapper.style.width = '800px';
      offscreenWrapper.style.padding = '32px';
      offscreenWrapper.style.backgroundColor = '#ffffff';
      offscreenWrapper.style.fontFamily = "'Poppins', sans-serif";
      offscreenWrapper.style.overflow = 'visible';
      offscreenWrapper.style.height = 'auto';
      offscreenWrapper.style.maxHeight = 'none';

      const clonedNode = targetElement.cloneNode(true) as HTMLElement;
      clonedNode.style.overflow = 'visible';
      clonedNode.style.height = 'auto';
      clonedNode.style.maxHeight = 'none';
      offscreenWrapper.appendChild(clonedNode);
      window.document.body.appendChild(offscreenWrapper);

      // Pre-convert all images in the clone to inline Base64 data URLs so external QR codes never taint or fail in html-to-image
      const imgElements = Array.from(offscreenWrapper.querySelectorAll('img'));
      await Promise.all(
        imgElements.map(async (imgEl) => {
          const src = imgEl.getAttribute('src');
          if (!src || src.startsWith('data:')) return;
          try {
            const response = await fetch(src, { mode: 'cors' });
            const blobImg = await response.blob();
            const base64Url = await new Promise<string>((res) => {
              const reader = new FileReader();
              reader.onloadend = () => res(reader.result as string);
              reader.readAsDataURL(blobImg);
            });
            imgEl.setAttribute('src', base64Url);
          } catch (e) {
            console.warn('Could not inline image for PDF:', src, e);
          }
        })
      );

      // Give browser 200ms to layout the unconstrained clone and decoded base64 images
      await new Promise((res) => setTimeout(res, 200));

      const fullWidth = offscreenWrapper.scrollWidth || 800;
      const fullHeight = offscreenWrapper.scrollHeight;

      // Convert HTML element to high-res PNG natively via browser engine
      const dataUrl = await toPng(offscreenWrapper, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: fullWidth,
        height: fullHeight,
        canvasWidth: fullWidth * 2,
        canvasHeight: fullHeight * 2,
        style: {
          overflow: 'visible',
          height: `${fullHeight}px`,
          maxHeight: 'none',
        },
      });

      if (offscreenWrapper.parentNode) {
        offscreenWrapper.parentNode.removeChild(offscreenWrapper);
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
