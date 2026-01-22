import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import pkg from "file-saver";
import jsPDF from "jspdf";
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
      const templatePath = "/plantillaMR.docx";
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
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      };

      const formatDateShort = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      };

      // Preparar los datos para la plantilla
      // Nota: Los nombres de las variables deben coincidir con los placeholders en el DOCX
      // Por ejemplo, si en el DOCX tienes {tenantName}, aquí debe ser tenantName
      // Usar current_address del inquilino si está disponible, sino usar propertyAddress
      const tenantAddress =
        contractData.tenantCurrentAddress || contractData.propertyAddress || "";

      const templateData = {
        tenantName: contractData.tenantName || "",
        tenantDni: contractData.tenantDni || "",
        tenantEmail: contractData.tenantEmail || "",
        tenantPhone: contractData.tenantPhone || "",
        tenantCurrentAddress: tenantAddress, // Domicilio actual del inquilino
        propertyName: contractData.propertyName || "",
        propertyAddress: contractData.propertyAddress || "", // Dirección de la propiedad (para referencia)
        roomName: contractData.roomName || "",
        monthlyRent: parseFloat(contractData.monthlyRent || 0).toFixed(2),
        monthlyRentWords: this.numberToWords(
          Math.floor(parseFloat(contractData.monthlyRent || 0)),
        ),
        depositAmount: parseFloat(contractData.depositAmount || 0).toFixed(2),
        depositAmountWords: this.numberToWords(
          Math.floor(parseFloat(contractData.depositAmount || 0)),
        ),
        startDate: formatDate(contractData.startDate),
        startDateShort: formatDateShort(contractData.startDate),
        endDate: formatDate(contractData.endDate),
        endDateShort: formatDateShort(contractData.endDate),
        contractMonths: contractData.contractMonths || 12,
        contractNotes: contractData.contractNotes || "",
        ownerName: contractData.ownerName || "Propietario",
        ownerDni: contractData.ownerDni || "",
        contractDate: formatDate(new Date().toISOString()),
        contractDateShort: formatDateShort(new Date().toISOString()),
        // Datos adicionales que pueden ser útiles
        tenantFullInfo: [
          contractData.tenantName || "",
          contractData.tenantDni ? `DNI: ${contractData.tenantDni}` : "",
          contractData.tenantEmail ? `Email: ${contractData.tenantEmail}` : "",
          contractData.tenantPhone
            ? `Teléfono: ${contractData.tenantPhone}`
            : "",
        ]
          .filter(Boolean)
          .join(", "),
      };

      // Renderizar el documento
      doc.render(templateData);

      // Generar el documento final
      const blob = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        compression: "DEFLATE",
      });

      // Descargar el archivo
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const fileName = `Contrato_Habitación_${(
        contractData.tenantName || "Inquilino"
      ).replace(/\s+/g, "_")}_${dateStr}.docx`;
      saveAs(blob, fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error("Error generando contrato:", error);

      // Manejar errores específicos de docxtemplater
      if (error.properties && error.properties.errors instanceof Array) {
        const errorMessages = error.properties.errors
          .map((e) => e.message)
          .join(", ");
        throw new Error(`Error en la plantilla: ${errorMessages}`);
      }

      throw new Error(error.message || "Error al generar el contrato");
    }
  },

  /**
   * Convierte un número a palabras en español
   */
  numberToWords(num) {
    const ones = [
      "",
      "uno",
      "dos",
      "tres",
      "cuatro",
      "cinco",
      "seis",
      "siete",
      "ocho",
      "nueve",
    ];
    const tens = [
      "",
      "",
      "veinte",
      "treinta",
      "cuarenta",
      "cincuenta",
      "sesenta",
      "setenta",
      "ochenta",
      "noventa",
    ];
    const hundreds = [
      "",
      "ciento",
      "doscientos",
      "trescientos",
      "cuatrocientos",
      "quinientos",
      "seiscientos",
      "setecientos",
      "ochocientos",
      "novecientos",
    ];

    if (num === 0) return "cero";
    if (num < 10) return ones[num];
    if (num < 20) {
      const specials = [
        "diez",
        "once",
        "doce",
        "trece",
        "catorce",
        "quince",
        "dieciséis",
        "diecisiete",
        "dieciocho",
        "diecinueve",
      ];
      return specials[num - 10];
    }
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      return tens[ten] + (one > 0 ? " y " + ones[one] : "");
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      return (
        hundreds[hundred] +
        (remainder > 0 ? " " + this.numberToWords(remainder) : "")
      );
    }
    return num.toString();
  },

  /**
   * Genera un contrato PDF con el mismo contenido que la plantilla Word
   */
  async generateContractAsPDF(contractData) {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      let y = margin;

      // Formatear fechas
      const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      };

      // Helper para añadir texto con wrap
      const addText = (text, fontSize = 10, isBold = false, lineHeight = 5) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);

        // Verificar si necesitamos nueva página
        if (y + lines.length * lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        doc.text(lines, margin, y);
        y += lines.length * lineHeight;
        return y;
      };

      const addSpace = (space = 5) => {
        y += space;
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // Helper para añadir texto con partes en negrita
      // Uso: addMixedText([{text: "Texto normal ", bold: false}, {text: "Texto negrita", bold: true}])
      const addMixedText = (parts, fontSize = 10, lineHeight = 5) => {
        doc.setFontSize(fontSize);
        let xPos = margin;
        const maxWidth = pageWidth - 2 * margin;

        // Combinar todo el texto para calcular altura total
        const fullText = parts.map((p) => p.text).join("");
        const lines = doc.splitTextToSize(fullText, maxWidth);

        // Verificar si necesitamos nueva página
        if (y + lines.length * lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        // Renderizar cada parte con su estilo
        parts.forEach((part) => {
          doc.setFont("helvetica", part.bold ? "bold" : "normal");
          const partText = part.text;

          // Dividir el texto de esta parte si es muy largo
          const words = partText.split(" ");

          words.forEach((word, wordIndex) => {
            const wordWithSpace =
              wordIndex < words.length - 1 ? word + " " : word;
            const wordWidth = doc.getTextWidth(wordWithSpace);

            // Si la palabra no cabe en la línea actual, saltar a la siguiente
            if (xPos + wordWidth > pageWidth - margin && xPos > margin) {
              y += lineHeight;
              xPos = margin;

              // Verificar nueva página
              if (y > pageHeight - margin) {
                doc.addPage();
                y = margin;
              }
            }

            doc.text(wordWithSpace, xPos, y);
            xPos += wordWidth;
          });
        });

        y += lineHeight;
        return y;
      };

      // Datos formateados
      const ownerName = contractData.ownerName || "M.ª Ángeles Díaz Trillo";
      const ownerDni = contractData.ownerDni || "03093405C";
      const propertyAddress =
        contractData.propertyAddress ||
        "C/ General Medrano de Miguel N.º 16 5B";
      const tenantName = contractData.tenantName || "";
      const tenantDni = contractData.tenantDni || "";
      const tenantCurrentAddress = contractData.tenantCurrentAddress || "";
      const startDate = formatDate(contractData.startDate);
      const endDate = formatDate(contractData.endDate);
      const monthlyRent = parseFloat(contractData.monthlyRent || 0).toFixed(0);
      const depositAmount = parseFloat(contractData.depositAmount || 0).toFixed(
        0,
      );
      const depositAmountWords = this.numberToWords(
        Math.floor(parseFloat(contractData.depositAmount || 0)),
      );
      const contractDate = formatDate(new Date().toISOString());

      doc.setTextColor(0, 0, 0);

      // === TÍTULO ===
      addText(
        "CONTRATO DE ARRENDAMIENTO DE HABITACIÓN EN PISO COMPARTIDO.",
        14,
        true,
      );
      addSpace(8);

      // === FECHA Y LUGAR ===
      addMixedText([
        { text: "En Guadalajara a ", bold: false },
        { text: contractDate, bold: true },
      ]);
      addText("Estamos reunidos:", 10);
      addSpace(5);

      // === ARRENDADOR ===
      addText("COMO PARTE ARRENDADORA:", 10, true);
      addMixedText([
        { text: "D/Doña ", bold: false },
        { text: ownerName, bold: true },
        { text: ", mayor de edad y titular del DNI ", bold: false },
        { text: ownerDni, bold: true },
        { text: ".", bold: false },
      ]);
      addMixedText([
        {
          text: "Propietaria de la vivienda compartida situada en ",
          bold: false,
        },
        { text: propertyAddress, bold: true },
      ]);
      addSpace(5);

      // === ARRENDATARIO ===
      addText("COMO PARTE ARRENDATARIA:", 10, true);
      addMixedText([
        { text: "D/Dña. ", bold: false },
        { text: tenantName, bold: true },
        { text: " mayor de edad con DNI/PASAPORTE ", bold: false },
        { text: tenantDni, bold: true },
      ]);
      addMixedText([
        { text: "Y con domicilio en ", bold: false },
        { text: tenantCurrentAddress, bold: true },
      ]);
      addSpace(8);

      // === CONVENIO ===
      addText("AMBAS PARTES CONVIENEN EL ARRIENDO DE LA HABITACIÓN", 11, true);
      addMixedText([
        { text: "Que se inicia el día ", bold: false },
        { text: startDate, bold: true },
        { text: " finalizando el día ", bold: false },
        { text: endDate, bold: true },
        { text: ". El precio del arriendo es de ", bold: false },
        { text: monthlyRent + "€", bold: true },
        {
          text: " mensuales, estando incluidos los gastos a excepción de calefacción y electricidad que deberán ser abonados de la siguiente forma, a dividir entre todos los ocupantes de la vivienda.",
          bold: false,
        },
      ]);
      addSpace(3);

      addMixedText([
        {
          text: "EL DEPÓSITO que, como garantía deberá abonar el ARRENDATARIO es de ",
          bold: false,
        },
        { text: depositAmount + "€", bold: true },
        { text: " (", bold: false },
        { text: depositAmountWords.toUpperCase() + " EUROS", bold: true },
        {
          text: "), importe que le será devuelto al finalizar el contrato, bien en metálico bien por transferencia bancaria.",
          bold: false,
        },
      ]);
      addSpace(3);

      addText(
        "Este contrato no tiene validez como justificante de pago del arriendo, EL ARRENDADOR le deberá entregar al ARRENDATARIO un recibo como justificante de pago.",
        10,
      );
      addSpace(3);

      addText(
        "El objeto del ARRIENDO ES EXCLUSIVAMENTE la habitación que se indica, sin derecho a utilizar otros dormitorios de la casa. En cuanto al resto del mismo, EL ARRENDADOR acepta compartir el uso de la cocina, salón, y baño común para lo que se obliga a las normas de respeto y buena convivencia.",
        10,
      );
      addSpace(8);

      // === DERECHO DE ACCESO ===
      addText("DERECHO DE ACCESO A LA VIVIENDA DEL ARRENDADOR.", 10, true);
      addText(
        "Las partes acuerdan expresamente la renuncia del arrendatario a impedir que el arrendador pueda acceder a las zonas comunes de la vivienda. La violación de este derecho del arrendador por parte de cualquier persona que se encuentre en la vivienda será considerada causa de disolución del contrato y motivo de desahucio del arrendatario, siendo este responsable de los daños y perjuicios que el impedimento del acceso pueda ocasionar al arrendador, entre otros la perdida de beneficios por no poder arrendar otras habitaciones.",
        10,
      );
      addSpace(5);

      // === CLÁUSULA DE PREAVISO ===
      addText("CLÁUSULA DE PREAVISO Y PERMANENCIA MENSUAL", 10, true);
      addText(
        "En caso de que el ARRENDATARIO desee dar por finalizado el contrato antes de su fecha de vencimiento, deberá comunicarlo al ARRENDADOR con un mínimo de 15 días naturales de antelación.",
        10,
      );
      addText(
        "No obstante, aunque se haya dado el preaviso dentro de ese plazo, el ARRENDATARIO estará obligado a abonar la mensualidad completa del mes en el que abandone la habitación, no correspondiendo, en ningún caso, el prorrateo de dicho importe.",
        10,
      );
      addSpace(5);

      // === RESCISIÓN ===
      addText(
        "EL ARRENDADOR podrá rescindir el contrato UNILATERALMENTE DE FORMA INMEDIATA si existen faltas en las normas del piso, o de buena convivencia entre compañeros o con el vecindario de la casa, o bien si estuviera en situación de falta de pago de la renta o suministros y/o calefacción, como también si existiera incumplimiento de cualquiera de los términos del contrato.",
        10,
      );
      addSpace(3);

      addText(
        "EL ARRENDADOR se reserva el derecho de rescindir el contrato por cualquier causa diferente a las anteriores siempre y cuando lo comunique al arrendatario con un mes de antelación.",
        10,
      );
      addSpace(3);

      addText(
        "Queda prohibida la introducción de terceras personas sin previo aviso al arrendador, la contratación de ningún tipo de servicios, así como la cesión PARCIAL o TOTAL de este contrato, sin previo permiso escrito de la propiedad.",
        10,
      );
      addSpace(3);

      addText(
        "El contrato no se podrá ceder ni subarrendar de forma parcial por el arrendatario sin previo consentimiento por escrito del arrendador.",
        10,
      );
      addSpace(3);

      addText(
        "No se permite fumar en el interior de la casa, ya que dispone de zonas, como el patio, en las que se puede fumar sin molestar al resto de inquilinos.",
        10,
      );
      addSpace(3);

      addText(
        "EL ARRENDATARIO está obligado a cumplir las normas de la casa, respetando el descanso de todos los que habitan la casa, especialmente desde las 23:00 hasta las 8:00.",
        10,
      );
      addSpace(3);

      addText(
        "EL ARRENDATARIO declara que el piso está en buen estado, obligándose a conservar todo con la mayor diligencia y a abonar los desperfectos que no sean debidos a un uso normal y correcto. Al finalizar el contrato, se comprobará que haya habido una correcta conservación de la casa y mobiliario. Siendo objeto de arriendo exclusivamente la habitación expresada, la propiedad conserva su derecho a entrar y salir de la casa por lo que el arrendatario se obliga a no cambiar la cerradura de la puerta. Por pérdida de llaves se abonará su importe.",
        10,
      );
      addSpace(3);

      addText(
        "Queda terminantemente PROHIBIDA cualquier obra o alteración en el piso, sin previo permiso por escrito de la propiedad, así como la entrada de animales en el piso.",
        10,
      );
      addSpace(3);

      addText(
        "EL ARRENDADOR no se hace responsable de pérdidas o hurtos en las habitaciones. A tal efecto todas las habitaciones tienen cerradura privada.",
        10,
      );
      addSpace(3);

      addText(
        "EL ARRENDADOR tampoco se hace responsable de los posibles daños que pudieran surgir en los dispositivos eléctricos ajenos enchufados en la red eléctrica del piso.",
        10,
      );
      addSpace(3);

      addText(
        "Y en prueba de conformidad con todo cuanto antecede, firman ambas partes en lugar y fecha indicados.",
        10,
      );
      addSpace(15);

      // === FIRMAS ===
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("EL ARRENDADOR", margin, y);
      doc.text("EL ARRENDATARIO", pageWidth - margin - 40, y);
      addSpace(25);

      // === NUEVA PÁGINA PARA NORMAS ===
      doc.addPage();
      y = margin;

      addText("NORMAS DE RESPETO Y BUENA CONVIVENCIA", 12, true);
      addSpace(8);

      const normas = [
        "Repartir y asignar las distintas tareas del hogar. De esta manera, evitarás en la medida de lo posible las discusiones. Dejarlo a la buena voluntad de cada uno no funciona.",
        "Dejar lo más limpio y presentable posible las habitaciones comunes, como el baño o la cocina.",
        "Establecer unos horarios de silencio ya que se puede molestar a algunos compañeros que tengan que trabajar. Horario mínimo a respetar de 23h a 8h, no usar la lavadora ni el lavavajillas ni ningún otro electrodoméstico que haga ruido a partir de las 23h.",
        "Se recomienda no mostrar actitudes demasiado impositivas o irritantes porque puedes acabar perdiendo compañeros o no encontrando piso.",
        "En el caso de que alguien fume, NUNCA se hará en el interior de la casa, se hará en el patio o terraza.",
        "Se recomienda la aportación de un fondo común para la comprar de productos de uso común como lavavajillas, papel higiénico, detergente para la lavadora etc.",
        "No manipular ni el calentador ni estufa de pellet avisar en caso de que no funcione correctamente.",
        "Frigorífico: Organizar el espacio en función de los compañeros que haya. Limpiar el interior al menos una vez al mes.",
        "No acumular basura dentro de la casa, imprescindible tirarla a diario.",
      ];

      normas.forEach((norma, index) => {
        addText(`• ${norma}`, 10);
        addSpace(3);
      });

      // Generar blob del PDF
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const fileName = `Contrato_Habitación_${(
        tenantName || "Inquilino"
      ).replace(/\s+/g, "_")}_${dateStr}.pdf`;

      const pdfBlob = doc.output("blob");
      const pdfFile = new File([pdfBlob], fileName, {
        type: "application/pdf",
      });

      // Intentar usar Web Share API si está disponible
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [pdfFile] })
      ) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: "Contrato de Alquiler",
            text: `Contrato de ${tenantName}`,
          });
          return { success: true, fileName, shared: true };
        } catch (shareError) {
          // Si el usuario cancela o hay error, descargar normalmente
          console.log("Share cancelled or failed, downloading instead");
          doc.save(fileName);
          return { success: true, fileName, shared: false };
        }
      } else {
        // Fallback: descargar el archivo
        doc.save(fileName);
        return { success: true, fileName, shared: false };
      }
    } catch (error) {
      console.error("Error generando contrato PDF:", error);
      throw new Error(error.message || "Error al generar el contrato PDF");
    }
  },
};
