import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import pkg from 'file-saver';
const { saveAs } = pkg;

/**
 * Servicio para generar contratos desde plantilla DOCX
 */
export const contractService = {
  /**
   * Genera un contrato DOCX desde la plantilla
   * @param {Object} contractData - Datos del contrato
   * @param {string} contractData.tenantName - Nombre del inquilino
   * @param {string} contractData.tenantDni - DNI del inquilino
   * @param {string} contractData.tenantEmail - Email del inquilino
   * @param {string} contractData.tenantPhone - Teléfono del inquilino
   * @param {string} contractData.propertyName - Nombre de la propiedad
   * @param {string} contractData.propertyAddress - Dirección de la propiedad
   * @param {string} contractData.roomName - Nombre de la habitación
   * @param {number} contractData.monthlyRent - Renta mensual
   * @param {number} contractData.depositAmount - Cantidad de depósito
   * @param {string} contractData.startDate - Fecha de inicio (ISO string)
   * @param {string} contractData.endDate - Fecha de fin (ISO string)
   * @param {number} contractData.contractMonths - Duración en meses
   * @param {string} contractData.contractNotes - Notas adicionales
   * @param {string} contractData.ownerName - Nombre del propietario
   * @param {string} contractData.ownerDni - DNI del propietario
   */
  async generateContractFromTemplate(contractData) {
    try {
      // Cargar la plantilla DOCX desde la carpeta static
      const templatePath = '/plantillaMR.docx';
      const response = await fetch(templatePath);
      
      if (!response.ok) {
        throw new Error(`Error al cargar la plantilla: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Formatear fechas
      const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      };

      const formatDateShort = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      };

      // Preparar los datos para la plantilla
      // Nota: Los nombres de las variables deben coincidir con los placeholders en el DOCX
      // Por ejemplo, si en el DOCX tienes {tenantName}, aquí debe ser tenantName
      // Usar current_address del inquilino si está disponible, sino usar propertyAddress
      const tenantAddress = contractData.tenantCurrentAddress || contractData.propertyAddress || '';
      
      const templateData = {
        tenantName: contractData.tenantName || '',
        tenantDni: contractData.tenantDni || '',
        tenantEmail: contractData.tenantEmail || '',
        tenantPhone: contractData.tenantPhone || '',
        tenantCurrentAddress: tenantAddress, // Domicilio actual del inquilino
        propertyName: contractData.propertyName || '',
        propertyAddress: contractData.propertyAddress || '', // Dirección de la propiedad (para referencia)
        roomName: contractData.roomName || '',
        monthlyRent: parseFloat(contractData.monthlyRent || 0).toFixed(2),
        monthlyRentWords: this.numberToWords(Math.floor(parseFloat(contractData.monthlyRent || 0))),
        depositAmount: parseFloat(contractData.depositAmount || 0).toFixed(2),
        depositAmountWords: this.numberToWords(Math.floor(parseFloat(contractData.depositAmount || 0))),
        startDate: formatDate(contractData.startDate),
        startDateShort: formatDateShort(contractData.startDate),
        endDate: formatDate(contractData.endDate),
        endDateShort: formatDateShort(contractData.endDate),
        contractMonths: contractData.contractMonths || 12,
        contractNotes: contractData.contractNotes || '',
        ownerName: contractData.ownerName || 'Propietario',
        ownerDni: contractData.ownerDni || '',
        contractDate: formatDate(new Date().toISOString()),
        contractDateShort: formatDateShort(new Date().toISOString()),
        // Datos adicionales que pueden ser útiles
        tenantFullInfo: [
          contractData.tenantName || '',
          contractData.tenantDni ? `DNI: ${contractData.tenantDni}` : '',
          contractData.tenantEmail ? `Email: ${contractData.tenantEmail}` : '',
          contractData.tenantPhone ? `Teléfono: ${contractData.tenantPhone}` : ''
        ].filter(Boolean).join(', '),
      };

      // Renderizar el documento
      doc.render(templateData);

      // Generar el documento final
      const blob = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        compression: 'DEFLATE',
      });

      // Descargar el archivo
      const fileName = `Contrato_${(contractData.roomName || 'Habitacion').replace(/\s+/g, '_')}_${(contractData.tenantName || 'Inquilino').replace(/\s+/g, '_')}_${new Date().getTime()}.docx`;
      saveAs(blob, fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error('Error generando contrato:', error);
      
      // Manejar errores específicos de docxtemplater
      if (error.properties && error.properties.errors instanceof Array) {
        const errorMessages = error.properties.errors.map(e => e.message).join(', ');
        throw new Error(`Error en la plantilla: ${errorMessages}`);
      }
      
      throw new Error(error.message || 'Error al generar el contrato');
    }
  },

  /**
   * Convierte un número a palabras en español
   */
  numberToWords(num) {
    const ones = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
    
    if (num === 0) return 'cero';
    if (num < 10) return ones[num];
    if (num < 20) {
      const specials = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
      return specials[num - 10];
    }
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      return tens[ten] + (one > 0 ? ' y ' + ones[one] : '');
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      return hundreds[hundred] + (remainder > 0 ? ' ' + this.numberToWords(remainder) : '');
    }
    return num.toString();
  }
};

