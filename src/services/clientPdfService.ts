import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Html2CanvasOptionsExtended {
  scale?: number;
  logging?: boolean;
  useCORS?: boolean;
  allowTaint?: boolean;
}

export const generatePDFClient = async (elementId: string, filename: string = 'dossier.pdf') => {
  try {
    // Get the element to convert
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // Show loading state
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 9999;';
    loadingDiv.innerHTML = 'Génération du PDF en cours...';
    document.body.appendChild(loadingDiv);

    // Convert to canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true
    } as Html2CanvasOptionsExtended);

    // Calculate dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    // Add image to PDF
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add new pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Remove loading state
    document.body.removeChild(loadingDiv);

    // Save PDF
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

export const generatePDFFromHTML = (htmlContent: string, filename: string = 'dossier.pdf') => {
  // Create a temporary container
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.id = 'temp-pdf-container';
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  // Generate PDF
  generatePDFClient('temp-pdf-container', filename).then(() => {
    // Clean up
    document.body.removeChild(container);
  });
};